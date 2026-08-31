import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "DevConnect API Documentation",
            version: "1.0.0",
            description: "Production-grade developer networking platform REST API documentation. Includes user management, developer profiles, connections, real-time messaging, comments, and analytics."
        },
        servers: [
            {
                url: "http://localhost:8000/api/v1",
                description: "Local Development Server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
    app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
