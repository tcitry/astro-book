# Development, verification and releases

The theme and any blog that consumes it have separate repositories, lockfiles and release histories. Develop general reading behavior here, then install a packed artifact in the blog for integration testing. Keep blog content transforms, site data and demos in the blog.

## Working locally

```sh
npm ci
npm run dev
npm run build
npm run check
npm test
npm run verify:package
```

The example uses public synthetic fixtures. Default development and package CI require no commercial subscription, login, license token or private package registry. The package-check workflow does not publish; the documentation has a separate Pages workflow, and npm publication uses the explicit release workflow described below.

`verify:package` retains an independent temporary consumer and writes a compact report to `.artifacts/packed-consumer.json`. It installs the generated tarball with a clean npm user configuration and without registry authentication tokens, runs its build/check and checks packaged CSS, fonts, math, diagram markup and framework-free reading pages. Runtime interactions and visual comparisons still need browser testing.

For a consumer integration pass, install the tarball into that repository, build it and compare representative URLs before and after. Include article/list/taxonomy/timeline/card pages, mobile navigation, narrow tables/formulas, diagram errors, search, copy, zoom, comments and each framework island in both color schemes. A workspace link is useful during development but does not replace artifact testing.

## Versioning

Use Changesets to record public API and behavior changes:

```sh
npx changeset
```

For releases after 0.1.0, review the changeset, use `npx changeset version` to update the package version/changelog, update the lockfile, then commit the resulting changes. Publication is an explicit maintainer action: pushes and pull requests do not automatically publish npm packages.

Prefer a minor version for additive components/options and a major version for breaking props, styling contracts or supported Astro versions. Fixes that preserve the public API use patch versions. Public component subpaths, exported types, slot names, assets and documented design variables are part of the compatibility surface.

## Publish to npm

The public package is `@tcitry/astro-book`. Its manifest fixes `publishConfig.access` to `public` and the registry to `https://registry.npmjs.org/`. The repository root and example are private workspaces and are not published.

For the first release, use an npm account authorized to publish under the `@tcitry` scope:

```sh
npm login --registry=https://registry.npmjs.org/
npm run release:check
npm run release:publish -- --dry-run
npm run release:publish
```

`release:check` builds the theme and documentation, runs type checks and tests, and installs a real packed artifact in an independent consumer. Only after that consumer passes does it write `.artifacts/tcitry-astro-book.tgz`. `release:publish` uploads that exact tarball without rebuilding it. Do not edit source between verification and publication; repeat verification after any change. The packed-consumer report records the version and SHA-512 integrity, and neither report nor tarball is committed.

Once the package exists, configure [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) in its npm settings:

- Provider: GitHub Actions.
- Organization or user: `tcitry`.
- Repository: `astro-book`.
- Workflow filename: `publish.yml`.
- Environment name: leave empty; this workflow does not select a GitHub environment.
- Allow direct `npm publish` for this publisher.

The workflow uses GitHub-hosted runners and OIDC, with no stored npm publish token. Its Node.js 24 and npm 11.12.1 satisfy npm's trusted-publishing requirements. To release, run **Publish npm package** from the repository's Actions page, select `main`, and enter the exact version from `packages/astro-book/package.json`. The workflow verifies that version, runs the complete release checks, and publishes the tested tarball with provenance. It must first be present in the repository and authorized in npm settings.

After publication, verify the registry version and install it in a fresh Astro project without authentication:

```sh
npm view @tcitry/astro-book version dist.integrity
npm install --save-exact @tcitry/astro-book@0.1.0
```

Use the released version when publishing later updates. Follow the [setup guide](getting-started.md), run the consumer's check/build, and inspect search through its built preview. `npm run pack:theme` remains available for testing unpublished local changes.

## Consumer upgrades and rollback

Pin the exact package version or retain the exact tarball and lockfile used for an integration test. Upgrade the package and lockfile in the consuming repository, run the consumer's route/feature checks, then compare visual baselines before adopting the upgrade. The theme repository does not rewrite the consumer's content.

To roll back, restore the previous package reference and lockfile, reinstall and rebuild the consuming site. Keep the previous deployment or static build until acceptance is complete. Theme rollback should not require changing article sources or their URLs.

## Licensing and source provenance

The package is MIT-licensed. Preserve Hugo Book's original license, author attribution and recorded source revision when porting reading features. Follow the lightweight [upstream record](upstream.md); do not restore Hugo template or Sass build dependencies. Record other vendored assets and licenses in `packages/astro-book/THIRD_PARTY_NOTICES.md`. Never copy a consuming site's credentials, generated private content or commercially licensed components into source, examples, tests, docs or release artifacts.
