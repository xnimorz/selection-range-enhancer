# Enhance window.Selection

Demo: https://codesandbox.io/s/selection-range-enhancer-fwuy8?file=/src/index.js

This project is dedicated to adding some functions when you work with selection.

Here are the possibilities:

1. tracks user selection throughout mouse, keyboard, touch, and mouse events
2. finds intersections between selection and target node
3. proxies addRange, removeAllRange funcs

## API

### track

This function allows you to subscribe to selection changes

| _Argument_                   | _Type_                                                                                                                                            | _Description_                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `htmlElement`                | Node                                                                                                                                              | will be used to subscriptions, if `subsscribeToDocument` is false                                                                                                              |
| `config.callback`            | `(selection: Selection, additional?: { kind?: OneOf['mouse', 'keyboard', 'pointer', 'touch']; reason?: oneOf['move', 'down', 'up'] }) => unknown` | will be called on every selection change                                                                                                                                       |
| `config.useBubbling`         | `boolean`                                                                                                                                         | by default track subscribes with capture flag, you are able to turn off it providing this param                                                                                |
| `config.trackDynamically`    | `boolean`                                                                                                                                         | will call `config.callback` on every touch \ mouse \ pointer`move` if this param switched to true. Otherwise, callback is called only when touch \ mouse \ pointer is released. Warning: it could reduce the performance of your application. For better UX use debouncing with this callback! |
| `config.trackMouse`          | `boolean`                                                                                                                                         | should track mouse events                                                                                                                                                      |
| `config.trackKeyBoard`       | `boolean`                                                                                                                                         | should track keyboard events                                                                                                                                                   |
| `config.trackPointer`        | `boolean`                                                                                                                                         | should track pointer events                                                                                                                                                    |
| `config.trackTouch`          | `boolean`                                                                                                                                         | should track touch events                                                                                                                                                      |
| `config.subscribeToDocument` | `boolean`                                                                                                                                         | should subscribe events to the document instead of provided htmlElement                                                                                                        |
