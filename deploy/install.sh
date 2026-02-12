#!/usr/bin/env bash
set -euo pipefail

# 颜色输出
info() { echo -e "\033[1;32m[信息]\033[0m $*"; }
warn() { echo -e "\033[1;33m[警告]\033[0m $*" >&2; }
err() { echo -e "\033[1;31m[错误]\033[0m $*" >&2; }
ask() { echo -e "\033[1;36m[询问]\033[0m $*"; }

require_root() {
  if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
    err "请使用 sudo 执行该脚本"
    exit 1
  fi
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

install_docker() {
  info "开始安装 Docker..."
  if ! curl -fsSL https://get.docker.com | sh; then
    err "Docker 安装失败"
    exit 1
  fi

  info "启动 Docker 服务..."
  systemctl enable docker
  systemctl start docker
}

check_docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif need_cmd docker-compose; then
    echo "docker-compose"
  else
    err "未检测到 docker compose 命令"
    err "请升级 Docker 或安装 docker-compose 插件"
    exit 1
  fi
}

# 显示欢迎信息
clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   K8RAY Nav - 一键部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

require_root

# 检查 curl
if ! need_cmd curl; then
  err "未检测到 curl，请先安装"
  exit 1
fi

# 检查并安装 Docker
if ! need_cmd docker; then
  warn "未检测到 Docker"
  ask "是否自动安装 Docker? (y/n) [y]: "
  read -r INSTALL_DOCKER < /dev/tty
  INSTALL_DOCKER=${INSTALL_DOCKER:-y}

  if [[ "$INSTALL_DOCKER" =~ ^[Yy]$ ]]; then
    install_docker
  else
    err "请先安装 Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
  fi
fi

# 检查 Docker 服务
if ! docker info >/dev/null 2>&1; then
  err "Docker 服务未运行"
  info "正在启动 Docker 服务..."
  systemctl start docker
  sleep 2

  if ! docker info >/dev/null 2>&1; then
    err "Docker 服务启动失败，请手动启动: sudo systemctl start docker"
    exit 1
  fi
fi

# 检查 docker compose
COMPOSE_CMD=$(check_docker_compose)

echo ""
info "开始配置安装参数..."
echo ""

# 1. 安装目录
ask "请输入安装目录 [/opt/k8ray-nav]: "
read -r INSTALL_DIR < /dev/tty
INSTALL_DIR=${INSTALL_DIR:-/opt/k8ray-nav}

# 2. 服务端口
ask "请输入服务端口 [80]: "
read -r PORT < /dev/tty
PORT=${PORT:-80}

# 验证端口范围
if [[ ! "$PORT" =~ ^[0-9]+$ ]] || [[ "$PORT" -lt 1 ]] || [[ "$PORT" -gt 65535 ]]; then
  err "无效的端口号，使用默认端口 80"
  PORT=80
fi

# 确认配置
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "配置确认"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "安装目录: $INSTALL_DIR"
info "服务端口: $PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
ask "确认开始安装? (y/n) [y]: "
read -r CONFIRM < /dev/tty
CONFIRM=${CONFIRM:-y}

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  warn "已取消安装"
  exit 0
fi

echo ""
info "开始安装..."
echo ""

# 创建安装目录
info "📁 准备安装目录: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# GitHub Raw 文件基础 URL（公开仓库，无需 token）
REPO_BASE_URL="https://raw.githubusercontent.com/DouDOU-start/k8ray-nav/master"

# 下载配置文件
info "📥 下载配置文件..."

if ! curl -fsSL "${REPO_BASE_URL}/deploy/docker-compose.yml" -o docker-compose.yml; then
  err "下载 docker-compose.yml 失败"
  exit 1
fi

if ! curl -fsSL "${REPO_BASE_URL}/deploy/nav.sh" -o nav.sh; then
  err "下载 nav.sh 失败"
  exit 1
fi

chmod +x nav.sh

info "✓ 配置文件下载完成"

# 写入端口配置
info "⚙️  写入端口配置..."
echo "PORT=${PORT}" > .env

# 拉取镜像
DOCKER_IMAGE="ghcr.io/doudou-start/k8ray-nav:latest"
info "🐳 拉取 Docker 镜像: $DOCKER_IMAGE"
docker pull "$DOCKER_IMAGE"

# 停止旧容器（如果存在）
if docker ps -a --format '{{.Names}}' | grep -q '^k8ray-nav$'; then
  info "🛑 停止旧容器..."
  $COMPOSE_CMD -f docker-compose.yml down
fi

# 启动服务
info "🚀 启动服务..."
$COMPOSE_CMD -f docker-compose.yml up -d

# 等待服务启动
info "⏳ 等待服务启动..."
sleep 3

# 安装管理命令
if [[ -f "nav.sh" ]]; then
  info "📦 安装管理命令..."
  cp nav.sh /usr/local/bin/nav
  chmod +x /usr/local/bin/nav
  info "✓ 已安装管理命令: nav"
else
  warn "未找到 nav.sh，跳过管理命令安装"
fi

# 检查服务状态
if docker ps --format '{{.Names}}' | grep -q '^k8ray-nav$'; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  info "✅ 安装完成！"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  info "📁 安装目录: $INSTALL_DIR"
  info "🌐 访问地址: http://<服务器IP>:${PORT}"
  echo ""
  info "常用命令:"
  info "  nav status   # 查看服务状态"
  info "  nav logs     # 查看实时日志"
  info "  nav restart  # 重启服务"
  info "  nav update   # 更新到最新版本"
  info "  nav help     # 查看所有命令"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  err "❌ 服务启动失败"
  err "请查看日志: cd $INSTALL_DIR && $COMPOSE_CMD -f docker-compose.yml logs"
  exit 1
fi
