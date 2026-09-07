# ─── STAGE 1: Build ──────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy pom.xml và pre-fetch dependencies để tận dụng Docker cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy mã nguồn và đóng gói file JAR (bỏ qua unit test trong lúc build image)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ─── STAGE 2: Runtime ────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Tạo non-root user đảm bảo bảo mật
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy artifact JAR từ builder stage
COPY --from=builder /app/target/*.jar app.jar

# Render sẽ ghi đè PORT qua biến môi trường
ENV PORT=8081
EXPOSE 8081

# Tinh chỉnh JVM cho môi trường Container & giới hạn RAM (Free Tier 512MB):
# -XX:+UseContainerSupport: đọc thông số cgroup chính xác
# -XX:MaxRAMPercentage=75.0: phân bổ tối đa ~384MB heap, chừa RAM cho OS và Metaspace
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
