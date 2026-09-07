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

The example uses public synthetic fixtures. Default development and CI require no commercial subscription, login, license token or private package registry. Public CI builds, tests and packages; it does not publish or deploy.

`verify:package` retains an independent temporary consumer and writes a compact report to `.artifacts/packed-consumer.json`. It installs the generated tarball with a clean npm user configuration and without registry authentication tokens, runs its build/check and checks packaged CSS, fonts, math, diagram markup and framework-free reading pages. Runtime interactions and visual comparisons still need browser testing.

For a consumer integration pass, install the tarball into that repository, build it and compare representative URLs before and after. Include article/list/taxonomy/timeline/card pages, mobile navigation, narrow tables/formulas, diagram errors, search, copy, zoom, comments and each framework island in both color schemes. A workspace link is useful during development but does not replace artifact testing.

## Versioning

Use Changesets to record public API and behavior changes:

```sh
npx changeset
```

Before a future release, run all checks, review the changeset, then use `npx changeset version` to update the package version/changelog and commit the resulting changes. Publishing is a separate, explicit maintainer action; no workflow in this repository performs it.

Prefer a minor version for additive components/options and a major version for breaking props, styling contracts or supported Astro versions. Fixes that preserve the public API use patch versions. Public component subpaths, exported types, slot names, assets and documented design variables are part of the compatibility surface.

## Consumer upgrades and rollback

Pin the exact package version or retain the exact tarball and lockfile used for an integration test. Upgrade the package and lockfile in the consuming repository, run the consumer's route/feature checks, then compare visual baselines before adopting the upgrade. The theme repository does not rewrite the consumer's content.

To roll back, restore the previous package reference and lockfile, reinstall and rebuild the consuming site. Keep the previous deployment or static build until acceptance is complete. Theme rollback should not require changing article sources or their URLs.

## Licensing and source provenance

The package is MIT-licensed. Preserve Hugo Book's original license, author attribution and recorded source revision when porting reading features. Follow the lightweight [upstream record](upstream.md); do not restore Hugo template or Sass build dependencies. Record other vendored assets and licenses in `packages/astro-book/THIRD_PARTY_NOTICES.md`. Never copy a consuming site's credentials, generated private content or commercially licensed components into source, examples, tests, docs or release artifacts.
