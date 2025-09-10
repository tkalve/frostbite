FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
# ARG TARGETARCH

WORKDIR /src

# Copy project file and restore as distinct layers
COPY --link *.sln .
COPY --link *.csproj .

RUN dotnet restore Frostbite.sln
# -a $TARGETARCH

# Copy source code and publish app
COPY --link . .
# RUN dotnet publish src/Snøføyk.Api/Snøføyk.Api.csproj -a $TARGETARCH --no-restore -o /app
RUN dotnet publish FrostbiteServer.csproj --no-restore -o /app



# Enable globalization and time zones:
# https://github.com/dotnet/dotnet-docker/blob/main/samples/enable-globalization.md
# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine
EXPOSE 8080

ENV \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    LC_ALL=en_US.UTF-8 \
    LANG=en_US.UTF-8
RUN apk add --no-cache \
    icu-data-full \
    icu-libs

WORKDIR /app
COPY --link --from=build /app .

USER $APP_UID
ENTRYPOINT ["./FrostbiteServer"]