FROM node:22.19.0-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @document-management/contracts build \
 && pnpm --filter @document-management/web build

FROM nginx:1.27.5-alpine AS runtime
COPY --from=build /workspace/src/apps/web/dist /usr/share/nginx/html
COPY src/apps/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
