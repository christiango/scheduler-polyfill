# Scheduler Polyfill

This is a polyfill for the [Prioritized Task Scheduling
API](https://wicg.github.io/scheduling-apis/). Documentation can be found on
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler).

The polyfill includes implementations of `Scheduler`, exposed through
`self.scheduler`, as well as `TaskController` and `TaskPriorityChangeEvent`
classes.

## `scheduler.postTask()`

The implementation uses a combination of `setTimeout`, `MessageChannel`, and
`requestIdleCallback` to implement task scheduling, falling back to `setTimeout`
when other APIs are not available.

The polyfill, like the native implementation, runs `scheduler` tasks in
descending priority order (`'user-blocking'` > `'user-visible'` >
`'background'`). But there are some differences in the relative order of
non-`scheduler` tasks:

 - `"background"` tasks are scheduled using `requestIdleCallback` on browsers
   that support it, which provides similar scheduling as `scheduler`. For
   browsers that don't support it, these tasks do not have low/idle event loop
   priority.

 - `"user-blocking"` tasks have the same event loop scheduling prioritization as
   `"user-visible"` (similar to `setTimeout()`), meaning these tasks do not have
   a higher event loop priority.

## `scheduler.yield()`

The polyfill does not support [priority or signal
inheritance](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield#inheriting_task_priorities),
so all continuations are scheduled with `"user-visible"` continuation priority.
The scheduling behavior of this depends on whether the browser supports
`scheduler.postTask()` (i.e. older Chrome versions):
  * For browsers that support `scheduler.postTask()`, `scheduler.yield()` is
    polyfilled with `"user-blocking"` `scheduler.postTask()` tasks. This means
    they typically have a higher event loop priority than other tasks
    (consistent with `yield()`), but they can be interleaved with other
    `"user-blocking"` tasks.

 * On browsers that don't support `scheduler.postTask()`, the same event loop
   prioritization as the `postTask()` polyfill applies (see above), but
   continuations run between `"user-blocking"` and `"user-visible"` tasks.

## Requirements

A browser that supports ES6 is required for this polyfill.

## Usage

### This fork

`@christiango/scheduler-polyfill` exports the implementations without installing
them on the global object. Applications are responsible for applying any polyfill.

```js
import {
  Scheduler,
  TaskController,
  TaskSignal,
  TaskPriorityChangeEvent,
} from '@christiango/scheduler-polyfill';

const scheduler = new Scheduler();
await scheduler.yield();
```

The installation and build instructions below describe the upstream package.

### Include via npm and a bundler

```console
npm install scheduler-polyfill
```

Import to populate the task-scheduling global variables, if not already
available in the executing browser:

```js
import 'scheduler-polyfill';
```

### Include via unpkg

```html
<script src="https://unpkg.com/scheduler-polyfill"></script>
```

### Building from source

```console
git clone https://github.com/GoogleChromeLabs/scheduler-polyfill
cd scheduler-polyfill
npm i
npm test        # Tests should pass
npm run build   # Outputs minified polyfill to dist/
```

```html
<script src="/path_to_polyfill/scheduler-polyfill.js"></script>
```

## Publishing this fork

Releases use [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
(OIDC) and [staged publishing](https://docs.npmjs.com/staged-publishing/).
GitHub Actions uploads the package for review; a maintainer must approve it on
npm with 2FA before it becomes publicly installable. No `NPM_TOKEN` secret is
used. Trusted publishing automatically includes provenance for this public
repository and package.

### One-time npm setup

Enable 2FA on your npm account. In the npm settings for
[`@christiango/scheduler-polyfill`](https://www.npmjs.com/package/@christiango/scheduler-polyfill),
add a **GitHub Actions** trusted publisher with these exact values:

| Field | Value |
| --- | --- |
| Organization or user | `christiango` |
| Repository | `scheduler-polyfill` |
| Workflow filename | `publish.yml` (not the full path) |
| Environment name | Leave empty; the workflow does not use a GitHub environment |
| Allowed actions | Stage-only: allow `npm stage publish`, not direct `npm publish` or dist-tag management |

Configure this when you are ready for a release: npm currently requires the first
successful publish within two days of creating the trust configuration.

After the first successful staged release and approval, set the package's
**Publishing access** to **Require two-factor authentication and disallow tokens**.
Revoke the old publishing token on npm and remove the repository's `NPM_TOKEN`
Actions secret. Removing the GitHub secret alone does not revoke the npm token.

### Releasing a version

1. Update `package.json` to a new, unpublished version and merge the change to
   `main`. This publishing migration does not itself bump or publish a version.
2. Create and publish a GitHub release from that commit with a tag matching the
   package version, either `1.0.5` or `v1.0.5`, for example. For a prerelease
   version such as `1.1.0-beta.1`, also mark the GitHub release as a prerelease.
3. The **Stage package for npm** workflow checks the release version, runs lint
   and browser tests, inspects package contents, and stages the package using
   short-lived OIDC credentials. Stable releases use the `latest` npm tag;
   GitHub prereleases use `next`. A successful workflow means **staged**, not
   publicly published.
4. On npm, open **Staged Packages**, review the package version, contents,
   provenance, and intended npm tag, then **Approve** with 2FA. Approval makes the
   version public. Reject it instead if anything is wrong.

You can also review and approve from an authenticated local npm CLI (npm 11.15.0
or newer, Node 22.14.0 or newer):

```console
npm stage list @christiango/scheduler-polyfill
npm stage view <stage-id>
npm stage download <stage-id>
npm stage approve <stage-id>
```

Staging reserves the package version. If you need to replace a staged package
or change its npm tag, reject it with 2FA (`npm stage reject <stage-id>`) before
re-staging. Do not retry the workflow blindly after a partial failure: check
**Staged Packages** first. An approved version cannot be overwritten.

## License

[Apache 2.0](LICENSE)
