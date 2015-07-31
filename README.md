# Open Layers Editor 3

The geometry editor for OpenLayers 3. This will be the sucessor to the
famous OpenLayers Editor a.k.a. OLE, which was designed to work with
OpenLayers 2. It is a complete reimplementation to leverage the modern
development tools used by OpenLayers 3, such as google's closure compiler.
In addition to the well known featureset of OLE it adds some new and unique
features such as the possibility to edit geometries as bezier curves.

## Current State
Early development. Not feature complete. Not ready for productive use.

## Contribution
Contributions are very welcome. Please make sure that your additions compile and add new features to the example index.html and update this readme.

## Features

- Edit Linestrings as Bézier curves.

## Usage
First instantiate the tools you want to use. Then create a new editor with the given tools and linked to your ol.Map object.

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

Build distributable file:

```bash
npm run-script build
```


## Run development server

```bash
npm run-script serve
```

Page accessible under localhost:3000
Debug mode with localhost:3000/?debug
