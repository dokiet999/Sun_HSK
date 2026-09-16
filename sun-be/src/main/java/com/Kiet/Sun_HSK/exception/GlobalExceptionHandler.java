package com.Kiet.Sun_HSK.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final String ERROR_BASE_URL = "https://sunhsk.com/errors/";

    // ── AppException (Lỗi nghiệp vụ) ──────────────────────────────────────────
    @ExceptionHandler(AppException.class)
    public ProblemDetail handleAppException(AppException ex, HttpServletRequest request) {
        ErrorCode errorCode = ex.getErrorCode();
        log.warn("AppException: [{}] {}", errorCode, ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.valueOf(errorCode.getHttpStatus()),
                ex.getMessage()
        );
        problem.setTitle(errorCode.name());
        problem.setType(URI.create(ERROR_BASE_URL + errorCode.name().toLowerCase().replace('_', '-')));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", errorCode.name());
        problem.setProperty("timestamp", Instant.now());

        return problem;
    }

    // ── Validation (@Valid) ──────────────────────────────────────────────────
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        String path = request instanceof ServletWebRequest swr
                ? swr.getRequest().getRequestURI()
                : "";

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                status,
                ErrorCode.VALIDATION_ERROR.getMessage()
        );
        problem.setTitle("VALIDATION_ERROR");
        problem.setType(URI.create(ERROR_BASE_URL + "validation-error"));
        if (!path.isBlank()) {
            problem.setInstance(URI.create(path));
        }

        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        problem.setProperty("errorCode", ErrorCode.VALIDATION_ERROR.name());
        problem.setProperty("invalidParams", errors);
        problem.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(status).body(problem);
    }

    // ── Unsupported Media Type ───────────────────────────────────────────────
    @Override
    protected ResponseEntity<Object> handleHttpMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        String path = request instanceof ServletWebRequest swr
                ? swr.getRequest().getRequestURI()
                : "";
        log.warn("Unsupported Content-Type: {}", ex.getContentType());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                status,
                "Content-Type phải là application/json"
        );
        problem.setTitle("UNSUPPORTED_MEDIA_TYPE");
        problem.setType(URI.create(ERROR_BASE_URL + "unsupported-media-type"));
        if (!path.isBlank()) {
            problem.setInstance(URI.create(path));
        }
        problem.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(status).body(problem);
    }

    // ── 403 Forbidden ────────────────────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("AccessDenied: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                ErrorCode.FORBIDDEN.getMessage()
        );
        problem.setTitle(ErrorCode.FORBIDDEN.name());
        problem.setType(URI.create(ERROR_BASE_URL + "forbidden"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", ErrorCode.FORBIDDEN.name());
        problem.setProperty("timestamp", Instant.now());

        return problem;
    }

    // ── 401 Unauthorized ─────────────────────────────────────────────────────
    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthException(AuthenticationException ex, HttpServletRequest request) {
        log.warn("AuthenticationException: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                ErrorCode.UNAUTHORIZED.getMessage()
        );
        problem.setTitle(ErrorCode.UNAUTHORIZED.name());
        problem.setType(URI.create(ERROR_BASE_URL + "unauthorized"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", ErrorCode.UNAUTHORIZED.name());
        problem.setProperty("timestamp", Instant.now());

        return problem;
    }

    // ── 500 Fallback (An toàn thông tin, không làm lộ stack trace) ────────────
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneral(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception occurred at {}: {}", request.getRequestURI(), ex.getMessage(), ex);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorCode.INTERNAL_ERROR.getMessage()
        );
        problem.setTitle(ErrorCode.INTERNAL_ERROR.name());
        problem.setType(URI.create(ERROR_BASE_URL + "internal-server-error"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errorCode", ErrorCode.INTERNAL_ERROR.name());
        problem.setProperty("timestamp", Instant.now());

        return problem;
    }
}
