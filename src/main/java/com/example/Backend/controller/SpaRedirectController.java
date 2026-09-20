package com.example.Backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaRedirectController {

    @RequestMapping(value = {
            "/",
            "/dashboard",
            "/admin-dashboard",
            "/delhi-forecast",
            "/air-quality-map",
            "/surveillance",
            "/station-diagnostics",
            "/profile",
            "/settings",
            "/login",
            "/admin-login",
            "/register",
            "/stations"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
