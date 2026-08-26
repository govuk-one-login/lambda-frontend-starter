# Lambda frontend starter project

## What features are included? (in no particular order and not exhaustive)

- Fastify-based frontend application running using ESM and strict TypeScript type checking
- Built with Rolldown to enable code splitting, tree shaking and minification to minimise cold start times
- Serving and client-side caching of static assets with cache busting query strings generated at build-time
- CSRF protection
- HTTP security headers via Helmet
- Nunjucks templating
- SCSS compilation and CSS minification
- Internationalisation
- Sessions using DynamoDB
- Analytics
- GOV.UK frontend and GOV.UK One Login frontend UI
- Device intelligence
- Base templates implementing a standard GOV.UK One Login header and footer, skip link, phase banner, form error summary, cookie banner, language toggle, back link
- Utilities for structured logging and metrics
- Request/response structured logging
- Fast local development server with file watching and rebuilding
- Local AWS stack via Docker: Floci and Local KMS
- AWS client preconfigured to work with AWS and the local emulations
- CloudFormation template containing most of the infrastructure needed to deploy this application via the Dev Platform SAM pipeline
- Dynatrace Lambda layer
- Sensible API Gateway and Lambda alarms
- Canaries
- Unit testing with Vitest
- Test coverage reporting
- Playwright + playwright-bdd for integration tests which run locally, in GitHub Actions and in the deployment pipeline
- Pre-written integration tests for included functionality
- Pre-written integration testing steps to enable quickly getting started writing more tests
- Pre-commit preconfigured
- GitHub Actions for deployment (including manually deploying to dev), linting, unit testing, integration testing, SonarCloud scanning, reviewing dependencies
- Dependabot pre-configured with cooldowns
- Quality gate manifest which reflects the checks in place
- `CODEOWNERS`, `CODE_OF_CONDUCT.md`, `SECURITY.md` included
- Normalisation of API Gateway event headers and query string parameters
- Utilities for Valibot schema validation errors mapped to GOV.UK error summary format
- Error handler and page
- Page not found handler and page
- Example pages to help getting started
- Healthcheck endpoint at `/healthcheck`
- Trailing slash removal
- robots.txt
- SonarCloud config

## How to get started

You will need the following infrastructure set up in your AWS accounts in order to use this project:

- A stack which configures the hosted zone for your application's domain or a parent domain of it. The stack should export a `HostedZoneId` output. There is no Dev Platform stack so this needs to be a custom stack. See https://github.com/govuk-one-login/account-components/blob/main/solutions/infra/hosted_zone.tf for how this is configured for Account Components.
- A Dev Platform signer stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/signer)
- A Dev Platform GitHub identity provider stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/github-identity)
- A Dev Platform test image repository stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/test-image-repository) specific to this application
- A Dev Platform build notifications stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/build-notifications)
- Two Dev Platform certificate stacks (https://github.com/govuk-one-login/devplatform-deploy/tree/main/certificate) for this application's domain or a parent domain of it, one in the application's region (`eu-west-2`) to use with API Gateway, and another in `us-east-1` to use with CloudFront
- A Dev Platform certificate expiry stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/certificate-expiry)
- A Dev Platform CloudFront stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/cloudfront-distribution) using the certificate in `us-east-1`. Despite being application specific infrastructure this is not included in `solutions/app-infra/template.yaml` because it drastically increases deployment times.
- A Dev Platform API Gateway logging stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/api-gateway-logs)
- A Dev Platform VPC stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/vpc) or spoke VPC stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/spoke-vpc) configured as follows:
  - `DynatraceApiEnabled`: `Yes` (see https://github.com/govuk-one-login/observability-infrastructure/blob/6cd6a5a26493ef08b99e4c88276a1b8c3b9ec1ff/lambdalayer/README.md?plain=1#L16)
  - `CloudFormationEndpointEnabled`: Set to `Yes` if the environment is dev or build (required for integration tests to run inside the VPC)
  - `CloudWatchLogsApiEnabled`: Set to `Yes` if the environment is dev or build (required for integration tests to run inside the VPC)
  - `CloudWatchApiEnabled`: `Yes`
  - `DynamoDBApiEnabled`: `Yes`
- A Dev Platform SAM deploy pipeline stack (https://github.com/govuk-one-login/devplatform-deploy/tree/main/sam-deploy-pipeline) configured as follows:
  - Allowed services: EC2 (required to attach lambdas to VPC), DynamoDB, Lambda (required for canaries), Xray
  - `ProgrammaticPermissionsBoundary`: `true`
  - `AdditionalCodeSigningVersionArns`: set the the value detailed at https://github.com/govuk-one-login/observability-infrastructure/blob/main/lambdalayer/README.md?plain=1#L13
  - `CustomKmsKeyArns`: set to the value detailed at https://github.com/govuk-one-login/observability-infrastructure/blob/main/lambdalayer/README.md?plain=1#L14
  - `RunTestContainerInVPC`: `true`
  - `TestReportFormat`: `CUCUMBERJSON`
  - `TestImageRepositoryNames`: the name of your test image repository (the Dev Platform test image repository stack outputs this as `TestRunnerImageEcrRepositoryName`) if the environment is dev or build, otherwise `none`
  - `TestImageRepositoryUri`: the URI of your test image repository (the Dev Platform test image repository stack outputs this as `TestRunnerImageEcrRepositoryUri`) if the environment is dev or build, otherwise `none`
  - `TestComputeType`: `BUILD_GENERAL1_2XLARGE` (ensures many integration tests can run in parallel)

Once this infrastructure is configured then:

- Fork this repo into the `govuk-one-login` organisation
- Consider configuring the new repo with these recommended settings:
  - Require the following passing checks: `sonarcloud`, `dependency-review`, `local-tests-integration`, `local-tests-unit`, `lint`
  - Require merge queue
- Find and action all instances of `CHANGEME` and `changeme`
- Retain the contents of this README file below the following horizontal rule, and then read them for further context and setup instructions

---

This repo contains the code for CHANGEME

## Set up and installation

- Copy `solutions/frontend/.env.sample` to `solutions/frontend/.env` and replace any placeholder values as appropriate
- Install [FNM](https://github.com/Schniz/fnm) or [NVM](https://github.com/nvm-sh/nvm) and select the correct Node version by running `nvm use` or `fnm use`
- Install Docker
- Install [Homebrew](https://brew.sh/)
- Install Brewfile dependencies with `npm run install-brewfile`
- Install dependencies with `npm ci --ignore-scripts`
- Install Git Hooks with `npm run install-git-hooks`
- Run `npm run start` to run the frontend. It will be available at `http://localhost:6002` and will watch for changes and rebuild on demand.

## Updating Node version

When updating the Node version you will need to update the following:

- `engines.node` field in all `package.json` files
- all `.nvmrc` files (the version should correspond to the lowest version which matches the `engines.node` field in the associated `package.json` file)
- Node version used by Lambda functions
- Node version used in Docker images
- ensure the base TSConfig installed as a development dependency in `package.json` corresponds with the Node version being used e.g. for Node 24 use the base TSConfig `@tsconfig/node24`
- update `tsconfig.json` and `solutions/integration-tests/tsconfig.json` to use the new base TSConfig and if base config settings are being extended then ensure that the base config value is reincluded if necessary
- ensure the major version of `@types/node` installed as a development dependency in `package.json` and `solutions/integration-tests/package.json` corresponds with the Node version being used
- where ESBuild is used (e.g. in Lambda `Metadata` in CloudFormation templates) ensure that the configured target matches the target in the base TSConfig e.g. the base TSConfig `@tsconfig/node24` sets a target of `es2024` and therefore the ESBuild target should be `es2024` too.

## Useful commands

There are various commands which can be run manually and which may also be run by Git hooks and in CI:

- `npm run start` to run the frontend locally and watch for changes
- `npm run build` to build the frontend
- `npm run test` to run [Vitest](https://vitest.dev/) tests
- `npm run test:watch` to run [Vitest](https://vitest.dev/) tests in watch mode
- `npm run test:coverage` to run [Vitest](https://vitest.dev/) tests and check coverage
- `npm run check-types` to run [TypeScript](https://www.typescriptlang.org/) type checking
- `npm run format` to run [Prettier](https://prettier.io/) formatting
- `npm run eslint` to run [ESLint](https://eslint.org/)
- `npm run knip` to run [Knip](https://knip.dev/)
- `npm run sam-validate` to run [SAM validation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-validate.html) against the CloudFormation template
- `npm run zizmor` to check GitHub Actions with [Zizmor](https://docs.zizmor.sh/)
- `npm run checkov` to run [Checkov](https://www.checkov.io/) checks against the repo
- `npm run detect-secrets` to detect secrets which should not be in the repo. False positives can be [ignored with comments](https://github.com/Yelp/detect-secrets?tab=readme-ov-file#inline-allowlisting) or by recreating the baseline file by running `npm run detect-secrets-recreate`
- `npm run audit` to check for NPM package vulnerabilities and check package signature integrity

If these commands detect issues it may be possible to fix them by running:

- `npm run format:fix`
- `npm run eslint:fix`
- `npm run knip:fix`
- `npm run zizmor:fix`

## Integration testing

See [Integration testing README](/solutions/integration-tests/README.md)
