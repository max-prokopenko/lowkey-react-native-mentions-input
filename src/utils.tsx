import React from 'react';
import { Text, TextStyle, TouchableWithoutFeedback } from 'react-native';
import matchAll from 'string.prototype.matchall';
import { PATTERNS } from './constants';

function getKeyComponent() {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return `mention_key_${result}`;
}

const decodeURIComponentSafely = (uri: string) => {
  try {
    return decodeURIComponent(uri);
  } catch (e) {
    console.log('URI Component not decodable: ' + uri);
    return uri;
  }
};

export const parseMarkdown = (
  text: string,
  mentionStyle: TextStyle,
  urlStyle?: TextStyle,
  handleURL?: (url: string) => void
) => {
  let textToParse = text;
  let parsedTextArray: Array<React.ReactNode> = [];
  let parseHeadIndex = 0;
  let matches = [...matchAll(text, PATTERNS.MENTION)];

  if (matches.length === 0) {
    let currentParsable = decodeURIComponentSafely(textToParse);
    let matchesURL = [...matchAll(currentParsable, PATTERNS.URL)];
    if (matchesURL.length > 0) {
      parsedTextArray.push(
        <Text key={getKeyComponent()}>
          {currentParsable.substring(0, matchesURL[0].index)}
        </Text>
      );
      matchesURL.map((url, index) => {
        let urlIndex = 0;
        if (typeof url.index !== 'undefined') {
          urlIndex = url.index;
        }
        index += 1;
        parsedTextArray.push(
          <TouchableWithoutFeedback
            key={getKeyComponent()}
            onPress={() => (handleURL ? handleURL(url[0]) : null)}
          >
            <Text style={urlStyle}>
              {currentParsable.substring(urlIndex, url[0].length + urlIndex)}
            </Text>
          </TouchableWithoutFeedback>
        );
        parsedTextArray.push(
          <Text key={getKeyComponent()}>
            {currentParsable.substring(
              url[0].length +
                (typeof url.index !== 'undefined' ? url.index : 0),
              index === matchesURL.length - 1
                ? currentParsable.length
                : matchesURL[index + 1].index
            )}
          </Text>
        );
      });
    } else {
      return <Text>{decodeURIComponentSafely(textToParse)}</Text>;
    }
    return parsedTextArray;
  }
  matches.map((match, index) => {
    const matchedUser = match[0].slice(2, -1);
    const mention = {
      id: matchedUser.split('::')[1],
      name: matchedUser.split('::')[0],
    };

    let currentParsable = decodeURIComponentSafely(
      textToParse.substring(parseHeadIndex, match.index)
    );
    let matchesURL = [...matchAll(currentParsable, PATTERNS.URL)];
    if (matchesURL.length > 0) {
      parsedTextArray.push(
        <Text key={getKeyComponent()}>
          {currentParsable.substring(0, matchesURL[0].index)}
        </Text>
      );
      matchesURL.map((url, index) => {
        let urlIndex = 0;
        if (typeof url.index !== 'undefined') {
          urlIndex = url.index;
        }
        parsedTextArray.push(
          <TouchableWithoutFeedback
            key={getKeyComponent()}
            onPress={() => (handleURL ? handleURL(url[0]) : null)}
          >
            <Text style={urlStyle}>
              {currentParsable.substring(urlIndex, url[0].length + urlIndex)}
            </Text>
          </TouchableWithoutFeedback>
        );
        parsedTextArray.push(
          <Text key={getKeyComponent()}>
            {currentParsable.substring(
              url[0].length + urlIndex,
              index === matchesURL.length - 1
                ? currentParsable.length
                : matchesURL[index + 1].index
            )}
          </Text>
        );
      });
    } else {
      parsedTextArray.push(
        <Text key={getKeyComponent()}>
          {decodeURIComponentSafely(
            textToParse.substring(parseHeadIndex, match.index)
          )}
        </Text>
      );
    }
    parsedTextArray.push(
      <Text style={mentionStyle} key={getKeyComponent()}>{`@${decodeURI(
        mention.name
      )}`}</Text>
    );
    if (typeof match.index === 'number') {
      parseHeadIndex = match.index + match[0].length;
    }

    if (index === matches.length - 1) {
      let lastParsable = decodeURIComponentSafely(
        textToParse.substring(parseHeadIndex, textToParse.length)
      );
      let matchesURL = [...matchAll(lastParsable, PATTERNS.URL)];
      if (matchesURL.length > 0) {
        parsedTextArray.push(
          <Text key={getKeyComponent()}>
            {lastParsable.substring(0, matchesURL[0].index)}
          </Text>
        );
        matchesURL.map((url, index) => {
          let urlIndex = 0;
          if (typeof url.index !== 'undefined') {
            urlIndex = url.index;
          }
          parsedTextArray.push(
            <TouchableWithoutFeedback
              key={getKeyComponent()}
              onPress={() => (handleURL ? handleURL(url[0]) : null)}
            >
              <Text style={urlStyle}>
                {lastParsable.substring(urlIndex, url[0].length + urlIndex)}
              </Text>
            </TouchableWithoutFeedback>
          );
          parsedTextArray.push(
            <Text key={getKeyComponent()}>
              {lastParsable.substring(
                url[0].length + urlIndex,
                index === matchesURL.length - 1
                  ? lastParsable.length
                  : matchesURL[index + 1].index
              )}
            </Text>
          );
        });
      } else {
        parsedTextArray.push(
          <Text key={getKeyComponent()}>
            {decodeURIComponentSafely(
              textToParse.substring(parseHeadIndex, textToParse.length)
            )}
          </Text>
        );
      }
    }
  });
  return parsedTextArray;
};
