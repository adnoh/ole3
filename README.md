# Open Layers Editor 3

The geometry editor for Open Layers 3. This will be the sucessor to the
famous Open Layers Editor a.k.a. OLE, which was designed to work with
Open Layers 2. It is a complete reimplementation to leverage the modern
development tools used by Open Layers 3, such as google's closure compiler.
In addition to the well known featureset of OLE it adds some new and unique
features such as the posibility to edit geometries as bezier curves.

## Features

- Edit LineStings as bezier curves.

## Usage
First instanciate the tools you want to use. Then create a new Editor with the given tools and linked to your ol.Map object.

```js
var tool1 = new ole3.tool.BezierEdit({
        features: ol.Collection(...)
    });
...
var editor = new ole3.Editor({
        map: new ol.Map({...}),
        tools: new ol.Collection([tool1, tool2, ...])
    });
```

## Dependencies

- node & npm

## Install

Run in your favorite console:

```bash
npm install
```

## Build

Build distributable file.

```bash
npm run-script build
```


## Run development server

```bash
npm run-script serve
```

Page accessible under localhost:3000
Debug mode with localhost:3000/?debug
