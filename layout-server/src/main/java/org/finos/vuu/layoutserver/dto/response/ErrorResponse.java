package org.finos.vuu.layoutserver.dto.response;

import lombok.Data;
import org.springframework.http.HttpStatus;

import javax.servlet.http.HttpServletRequest;
import java.util.Date;

@Data
public class ErrorResponse {
    private Date timestamp = new Date();
    private int status;
    private String error;
    private String message;
    private String path;

    public ErrorResponse(HttpServletRequest request, Exception ex, HttpStatus status) {
        this.status = status.value();
        this.error = status.getReasonPhrase();
        this.path = request.getRequestURI();
        this.message = ex.getMessage();
    }
}
