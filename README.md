# jspeg

pyPEG2 inspired, so it is regex with recursion. The syntax is more explicit, mostly due to the lack of tuples and syntactic sugar for them.

## Usage

Declare a class for each object type that needs to be parsed and define the `grammar` attribute using the defined functions of `src/index.js`

```javascript
class Word {}
Word.grammar = attr('content', /w+/);

class Sentence {}
Sentence.grammar = attr('content', some(one(ignore(/ +/), Word)))
```

See `example.js` for the example above and maves01/nanb-markup-js for something more complex.
