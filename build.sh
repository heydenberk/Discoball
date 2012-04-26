cat src/options.coffee | coffee --stdio --compile > discoball-options.js
cat src/discoball.coffee src/app.coffee | coffee --stdio --compile > discoball.js
