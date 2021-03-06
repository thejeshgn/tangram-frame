# tangram-frame
A nice frame for displaying a Tangram map.

Pass the scene file through the url as a query and the location as a hash to load it.

#### query parameters

- url: the scene file to load
- quiet: hides attribution and UI
- noscroll: disables scrolling for iframe embedding
- lib: Tangram version number, defaults to 0.9
- debug: Tangram build, when this is not present defaults to min
- gist: url of a github gist saved from Tangram Play

Examples:

http://tangrams.github.io/tangram-frame/?url=https://raw.githubusercontent.com/tangrams/tangram-sandbox/gh-pages/styles/blueprint.yaml#15/40.7053/-74.0097

http://tangrams.github.io/tangram-frame/?lib=0.7&debug&noscroll&quiet&url=https://raw.githubusercontent.com/tangrams/tangram-sandbox/gh-pages/styles/blueprint.yaml#15/40.7053/-74.0097
