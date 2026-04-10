export const environments = {
  local: {
    baseUrl: "http://localhost:8080",
  },
  staging: {
    baseUrl: "https://staging-api.petstoreapi.com",
  },
  prod: {
    baseUrl: "https://api.petstoreapi.com",
  },
};

export const currentEnv = environments[__ENV.ENV || "prod"];
