package org.finos.vuu.layoutserver.controller;

import org.finos.vuu.layoutserver.dto.response.ErrorResponse;
import org.finos.vuu.layoutserver.exceptions.InternalServerErrorException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import javax.servlet.http.HttpServletRequest;
import java.util.NoSuchElementException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Object> handleNotFound(HttpServletRequest request, Exception ex) {
        return generateResponse(request, ex, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Object> handleBadRequest(Exception ex, HttpServletRequest request) {
        return generateResponse(request, ex, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InternalServerErrorException.class)
    public ResponseEntity<Object> handleInternalServerError(HttpServletRequest request, Exception ex) {
        return generateResponse(request, ex, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<Object> generateResponse(HttpServletRequest request,
                                                    Exception ex,
                                                    HttpStatus status) {
        return new ResponseEntity<>(new ErrorResponse(request, ex, status), status);
    }
}
