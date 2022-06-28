// These rules dictate actual content of the API: headers, URL conventions, and general 
// Good Ideas™ for HTTP APIs, mainly from the books/blogs on apisyouwonthate.com

import { enumeration, truthy, falsy, undefined as undefinedFunc, pattern, schema } from "@stoplight/spectral-functions";
import { oas2, oas3 } from "@stoplight/spectral-formats";

// TODO Make sure every post/put/delete/patch endpoint has some sort of security (OAuth 2, API Key, but not both)
// TODO Mime type should have "; charset=utf-8"
// TODO No "(e/E)rror" in 2xx

export default {
  rules: {
    'api-home': {
      description: 'APIs MUST have a root path (`/`) defined.',
      message: 'Stop forcing all API consumers to visit documentation for basic interactions when the API could do that itself.',
      severity: "warn",
      given: "$.paths",
      then: {
        field: "/",
        function: truthy,
      }
    },
    'api-home-get': {
      description: 'APIs root path (`/`) MUST have a GET operation.',
      message: "Otherwise people won't know how to get it.",
      severity: "warn",
      given: "$.paths[/]",
      then: {
        field: "get",
        function: truthy,
      }
    },
    'api-health': {
      description: 'APIs MUST have a health path (`/health`) defined.',
      message: 'Creating a `/health` endpoint is a simple solution for pull-based monitoring and manually checking the status of an API.',
      severity: 'error',
      given: "$.paths",
      then: {
        field: "/health",
        function: truthy,
      }
    },
    'api-health-format': {
      description: 'Health path (`/heath`) SHOULD support Health Check Response Format\"',
      message: 'Use existing standards (and draft standards) wherever possible, like the draft standard for health checks: https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check',
      formats: [oas3],
      severity: "warn",
      given: "$.paths.[/health].responses[*].content.*~",
      then: {
        function: enumeration,
        functionOptions: {
          values: [
            "application/vnd.health+json"
          ]
        }
      }
    },
    'paths-kebab-case': {
      description: 'Should paths be kebab-case.',
      message: '{{property}} should be kebab-case (lower case and separated with hyphens)',
      severity: "warn",
      given: "$.paths[*]~",
      then: {
        function: pattern,
        functionOptions: {
          match: '^(/|[a-z0-9-.]+|{[a-zA-Z0-9_]+})+$'
        }
      }
    },
    'no-numeric-ids': {
      description: 'Please avoid exposing IDs as an integer, UUIDs are preferred.',
      severity: 'error',
      given: '$.paths..parameters[*].[?(@property === "name" && (@ === "id" || @.match(/(_id|Id)$/)))]^.schema',
      then: {
        function: schema,
        functionOptions: {
          schema: {
            type: "object",
            not: {
              properties: {
                type: {
                  const: "integer"
                }
              }
            },
            properties: {
              format: {
                const: 'uuid'
              }
            }
          }
        }
      }
    },
    'no-http-basic': {
      description: 'Consider a more secure alternative to HTTP Basic.',
      message: 'HTTP Basic is a pretty insecure way to pass credentials around, please consider an alternative.',
      severity: 'error',
      given: "$.components.securitySchemes[*]",
      then: {
        field: "scheme",
        function: pattern,
        functionOptions: {
          notMatch: 'basic'
        }
      }
    },
    'no-x-headers': {
      description: 'Please do not use headers with X-',
      message: 'Headers cannot start with X-, so please find a new name for {{property}}. More: https://tools.ietf.org/html/rfc6648',
      given: "$..parameters.[?(@.in === 'header')].name",
      then: {
        function: pattern,
        functionOptions: {
          notMatch: '^(x|X)-'
        }
      }
    },
    'no-x-response-headers': {
      description: 'Please do not use headers with X-',
      message: 'Headers cannot start with X-, so please find a new name for {{property}}. More: https://tools.ietf.org/html/rfc6648',
      given: "$..headers.*~",
      then: {
        function: pattern,
        functionOptions: {
          notMatch: '^(x|X)-'
        }
      }
    },
    'request-GET-no-body-oas3': {
      description: 'A `GET` request MUST NOT accept a request body',
      severity: 'error',
      formats: [oas3],
      given: "$.paths..get.requestBody",
      then: {
        function: undefinedFunc,
      }
    },
    'headers-lowercase-case': {
      description: 'All HTTP headers MUST use Hyphenated-Pascal-Case casing',
      severity: 'error',
      given: "$..parameters[?(@.in == 'header')].name",
      message: 'HTTP headers have the first letter of each word capitalized, and each word should be seperated by a hyphen.',
      type: "style",
      then: {
        function: pattern,
        functionOptions: {
          match: '/^([A-Z][a-z0-9]-)*([A-Z][a-z0-9])+/'
        }
      }
    },
    'hosts-https-only-oas2': {
      description: 'ALL requests MUST go through `https` protocol only',
      severity: 'error',
      formats: [oas2],
      type: "style",
      message: 'Schemes MUST be https and no other value is allowed.',
      given: "$.schemes",
      then: {
        function: schema,
        functionOptions: {
          schema: {
            type: "array",
            items: {
              type: "string",
              const: "https",
            },
            "maxItems": 1
          }
        }
      }
    },
    'hosts-https-only-oas3': {
      description: 'ALL requests MUST go through https:// protocol only',
      formats: [oas3],
      severity: 'error',
      message: 'Servers MUST be https and no other protocol is allowed.',
      given: "$.servers..url",
      then: {
        function: pattern,
        functionOptions: {
          match: '/^https:/'
        }
      }
    },
    'request-support-json-oas3': {
      description: 'Every request SHOULD support `application/json` media type',
      formats: [oas3],
      severity: "warn",
      message: '{{description}}: {{error}}',
      given: "$.paths.[*].requestBody.content[?(@property.indexOf('json') === -1)]^",
      then: {
        function: falsy,
      }
    },
    'no-unknown-error-format': {
      description: 'Every error response SHOULD support either RFC 7807 (https://tools.ietf.org/html/rfc6648) or the JSON:API Error format.',
      formats: [oas3],
      severity: "warn",
      given: "$.paths.[*]..responses[?(@property.match(/^(4|5)/))].content.*~",
      then: {
        function: enumeration,
        functionOptions: {
          values: [
            "application/vnd.api+json",
            "application/problem+xml",
            "application/problem+json",
          ]
        }
      }
    },
    'no-global-versioning': {
      description: 'Using global versions just forces all your clients to do a lot more work for each upgrade. Please consider using API Evolution instead.',
      message: 'Server URL should not contain global versions',
      given: "$.servers[*].url",
      then: {
        function: pattern,
        functionOptions: {
          notMatch: '/v[1-9]'
        }
      },
      formats: [oas3],
      severity: "warn",
    }
  }
};