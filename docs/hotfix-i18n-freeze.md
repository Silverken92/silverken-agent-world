# FR/EN mutation-loop hotfix

The first FR/EN implementation observed the entire application subtree and re-applied SilverKen branding/localization after DOM mutations. Some branding writes intentionally use `textContent`; those writes can themselves produce `childList` mutations even when the visible value is unchanged. The observer therefore had a path to continuously schedule its own branding pass and make the browser tab unresponsive.

The hotfix keeps the additive localization layer but loads it behind a guarded `MutationObserver`. During the observer callback the native observer is disconnected, the existing branding pass is allowed to complete, and observation resumes on the following microtask. Self-generated branding mutations are therefore not re-observed, while subsequent application mutations are still localized.

A regression test verifies both automatic reconnect and explicit-disconnect behavior.
