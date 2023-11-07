package org.finos.vuu.layoutserver.exceptions;

import org.finos.vuu.layoutserver.dto.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(HttpServletRequest request, Exception ex) {
        return generateResponse(request, ex, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(HttpServletRequest request, Exception ex) {

        return generateResponse(request, ex, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(HttpServletRequest request, MethodArgumentNotValidException ex) {
        return generateResponse(request, ex, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InternalServerErrorException.class)
    public ResponseEntity<ErrorResponse> handleInternalServerError(HttpServletRequest request, Exception ex) {
        return generateResponse(request, ex, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<ErrorResponse> generateResponse(HttpServletRequest request,
                                                    Exception ex,
                                                    HttpStatus status) {
        return new ResponseEntity<>(new ErrorResponse(request, List.of(ex.getMessage()), status), status);
    }

    private ResponseEntity<ErrorResponse> generateResponse(HttpServletRequest request,
                                                           MethodArgumentNotValidException ex,
                                                           HttpStatus status) {
        List<String> errors = ex.getFieldErrors()
                .stream()
                .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                .collect(Collectors.toList());

        return new ResponseEntity<>(new ErrorResponse(request, errors, status), status);
    }

}
