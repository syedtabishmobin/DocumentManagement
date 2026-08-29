FROM node:22.19.0-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @document-management/contracts build \
 && pnpm --filter @document-management/domain build \
 && pnpm --filter @document-management/api build

FROM node:22.19.0-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV DM_API_PORT=3000
ENV DM_BIND_HOST=0.0.0.0
WORKDIR /app
COPY --from=build /workspace/package.json /workspace/pnpm-workspace.yaml /workspace/pnpm-lock.yaml ./
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/src/packages ./src/packages
COPY --from=build /workspace/src/apps/api ./src/apps/api
COPY --from=build /workspace/migrations ./migrations
COPY --from=build /workspace/.agents/config/contacts.json ./.agents/config/contacts.json
COPY --from=build /workspace/.agents/config/notifications.json ./.agents/config/notifications.json
USER node
EXPOSE 3000
CMD ["node", "src/apps/api/dist/main.js"]
