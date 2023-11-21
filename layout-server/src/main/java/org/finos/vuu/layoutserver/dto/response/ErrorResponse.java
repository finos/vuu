package org.finos.vuu.layoutserver.dto.response;

import lombok.Data;
import org.springframework.http.HttpStatus;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;

@Data
public class ErrorResponse {
    private LocalDate timestamp = LocalDate.now();
    private int status;
    private String error;
    private List<String> messages;
    private String path;

    public ErrorResponse(HttpServletRequest request, List<String> messages, HttpStatus status) {
        this.status = status.value();
        this.error = status.getReasonPhrase();
        this.path = request.getRequestURI();
        this.messages = messages;
    }
}
