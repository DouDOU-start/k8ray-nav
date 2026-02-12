# K8RAY Nav 部署文档

## 系统要求

- Linux (Ubuntu 20.04+ / Debian 10+ / CentOS 7+)
- Docker 20.10+（脚本会自动安装）

## 一键部署

```bash
curl -fsSL https://raw.githubusercontent.com/DouDOU-start/k8ray-nav/master/deploy/install.sh | sudo bash
```

脚本会自动：
- 安装 Docker（如未安装）
- 交互式配置安装目录和端口
- 拉取镜像并启动服务

## 服务管理

```bash
nav status    # 查看状态
nav logs      # 查看日志
nav restart   # 重启
nav update    # 更新到最新版本
nav help      # 查看所有命令
```

## 配置说明

环境变量（`/opt/k8ray-nav/.env`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 80 | HTTP 端口 |

## 故障排查

### 容器无法启动
```bash
nav logs
```

### 端口被占用
```bash
# 查看占用
sudo lsof -i :80

# 修改端口后重启
echo "PORT=8080" > /opt/k8ray-nav/.env
nav restart
```

## 更新服务

```bash
nav update
```

或手动：
```bash
docker pull ghcr.io/doudou-start/k8ray-nav:latest
nav restart
```

## 卸载

```bash
nav stop
sudo rm /usr/local/bin/nav
sudo rm -rf /opt/k8ray-nav
```
