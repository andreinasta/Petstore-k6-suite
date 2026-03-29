export const environments = {
  prod: {
    baseUrl: "https://api.petstoreapi.com",
  },
};

export const currentEnv = environments[__ENV.ENV || "prod"];
