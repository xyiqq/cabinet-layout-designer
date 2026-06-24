# Cabinet Layout Designer / 柜体布局设计器

Open-source MVP for electrical cabinet, control panel, and network rack layout planning.

开源柜体布局设计 MVP，用于配电箱、控制柜和网络机柜的尺寸估算、设备摆放、清单导出和快速方案沟通。

## Screenshots / 截图

### Cabinet And Control Panel / 配电箱与控制柜

![Cabinet layout overview](https://raw.githubusercontent.com/xyiqq/cabinet-layout-designer/main/docs/images/cabinet-layout-designer-overview.png)

### Network Rack / 网络机柜

![Network rack layout](https://raw.githubusercontent.com/xyiqq/cabinet-layout-designer/main/docs/images/cabinet-layout-designer-rack.png)

## Pull And Run / 下载运行

```bash
docker pull xyiqq/cabinet-layout-designer:latest
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3000:3000 \
  xyiqq/cabinet-layout-designer:latest
```

Open / 打开：

```text
http://localhost:3000
```

Use another host port / 使用其他宿主机端口：

```bash
docker run -d \
  --name cabinet-layout-designer \
  --restart unless-stopped \
  -p 3188:3000 \
  xyiqq/cabinet-layout-designer:latest
```

## Compose

```bash
APP_PORT=3188 docker compose up -d
```

## Image Information / 镜像信息

- Image / 镜像：`xyiqq/cabinet-layout-designer:latest`
- Architectures / 架构：`linux/amd64`, `linux/arm64`
- Repository / 仓库：`https://github.com/xyiqq/cabinet-layout-designer`
- License / 许可证：MIT

## Notes / 说明

This is a client-side planning tool. It currently has no built-in authentication, user system, or server-side database. For public deployments, place it behind your own access control or reverse proxy policy when needed.

本项目当前是前端规划工具，没有内置认证、用户系统或服务端数据库。如果部署到公网，请根据需要自行放在访问控制或反向代理策略之后。
