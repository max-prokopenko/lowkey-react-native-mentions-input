import React from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TextInputSelectionChangeEventData,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

import matchAll from 'string.prototype.matchall';

interface Props {
  value: string;
  placeholder?: string;
  placeholderTextColor?: string;
  multiline?: boolean;
  onTextChange: (text: string) => void;
  onMarkdownChange: (markdown: string) => void;
  onFocusStateChange: (status: boolean) => void;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  innerComponent?: React.ReactNode;
  textInputStyle: ViewStyle;
  textInputTextStyle: TextStyle;
  mentionStyle: TextStyle;
  suggestedUsersComponent: any;
  users: {
    id: string;
    name: string;
    avatar: string;
  }[];
}
type State = {
  isSuggestionsOpen: boolean;
  currentCursorPosition: number;
  matches: Array<any>;
  mentions: Array<any>;
  markdown: string;
  suggestedUsers: {
    id: string;
    name: string;
    avatar: string;
    startPosition: number;
  }[];
};

type SuggestedUsers = {
  id: string;
  name: string;
  avatar: string;
  startPosition: number;
};

export default class MentionsInput extends React.Component<Props, State> {
  textInput = React.createRef<TextInput>();
  public static defaultProps = {
    placeholder: 'Write a message...',
    multiline: false,
  };
  state: State = {
    isSuggestionsOpen: false,
    suggestedUsers: [],
    currentCursorPosition: 0,
    matches: [],
    mentions: [],
    markdown: '',
  };
  componentDidUpdate() {
    if (
      this.props.value === '' &&
      (this.state.mentions.length > 0 || this.state.matches.length > 0)
    ) {
      this.setState({
        mentions: [],
        matches: [],
        currentCursorPosition: 1,
      });
    }
  }
  onTextChange = (text: string) => {
    this.handleMentions(text);
    // this.handleURLs(text);
  };
  handleMentions = (text: string) => {
    const pattern = /\B@[a-zA-Z0-9%_-]*/gi;

    let matches = [...matchAll(text, pattern)];
    let mentions = text.length > 0 ? this.state.mentions : [];
    console.log('\n ---------------- \n text', text);
    console.log('matches', matches);
    console.log('mentions', mentions);

    this.setState({ matches, mentions });
    setTimeout(() => {
      this.handleSuggestionsOpen(matches);
    }, 100);
    mentions.map(async (mention) => {
      const matchStartPosition = mention.user.startPosition;
      console.log(
        'Handle start positiom -> matchStartPosition',
        matchStartPosition
      );
      console.log(
        'Handle start positiom -> this.state.currentCursorPosition',
        this.state.currentCursorPosition
      );

      console.log(
        'Handle start positiom -> not at the end?',
        this.state.currentCursorPosition !== this.props.value.length,
        this.state.currentCursorPosition,
        this.props.value.length
      );
      if (decodeURI(text).length - decodeURI(this.props.value).length > 0) {
        if (
          matchStartPosition + (text.length - this.props.value.length) >
            this.state.currentCursorPosition &&
          this.state.currentCursorPosition !== this.props.value.length
        ) {
          console.log('Handle start positiom 1');
          mention.user.startPosition =
            mention.user.startPosition +
            (text.length - this.props.value.length);
        }
      } else {
        if (matchStartPosition >= this.state.currentCursorPosition) {
          console.log('Handle start positiom 2');
          mention.user.startPosition =
            mention.user.startPosition +
            (text.length - this.props.value.length);
        }
      }
      return mention;
    });
    console.log('Length 4', mentions);
    this.setState({
      mentions,
    });
    this.props.onTextChange(text);
    setTimeout(() => {
      this.formatMarkdown();
    }, 100);
  };
  handleSuggestionsOpen = (matches: RegExpMatchArray[]) => {
    let shoouldPresentSuggestions = false;
    let suggestedUsers: Array<SuggestedUsers> = [];
    this.props.users.map(
      (user, index) =>
        (suggestedUsers[index] = {
          ...user,
          startPosition: 0,
        })
    );
    matches.map((match) => {
      if (match === null) {
        return;
      }
      const matchStartPosition = match.index;
      if (typeof matchStartPosition === 'undefined') {
        return;
      }
      const matchEndPosition = matchStartPosition + match[0].length;
      if (
        this.state.currentCursorPosition > matchStartPosition &&
        this.state.currentCursorPosition <= matchEndPosition
      ) {
        shoouldPresentSuggestions = true;
        suggestedUsers = suggestedUsers
          .filter((user) =>
            user.name
              .toLowerCase()
              .includes(match[0].substring(1).toLowerCase())
          )
          .map((user) => {
            user.startPosition = matchStartPosition;
            return user;
          });
      }
    });
    this.setState({
      isSuggestionsOpen: shoouldPresentSuggestions,
      suggestedUsers,
    });
  };
  handleDelete = ({
    nativeEvent,
  }: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (nativeEvent.key === 'Backspace') {
      this.state.mentions.map((mention, index) => {
        const matchStartPosition = mention.user.startPosition;
        const matchEndPosition =
          matchStartPosition + mention.user.name.length + 1;
        if (
          this.state.currentCursorPosition > matchStartPosition &&
          this.state.currentCursorPosition <= matchEndPosition
        ) {
          let mentions = this.state.mentions;
          mentions.splice(index, 1);
          setTimeout(() => {
            this.setState({
              mentions,
            });
          }, 10);
        }
      });
    }
  };
  transformTag = (value: string) => {
    return value
      .replace(/\s+/g, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };
  handleAddMentions = (user: {
    id: number;
    name: string;
    avatar: string;
    startPosition: number;
  }) => {
    const startPosition = user.startPosition;
    const mention = this.state.mentions.find(
      (m) => m.user.startPosition === startPosition
    );
    if (mention) {
      return;
    }

    const match = this.state.matches.find((m) => m.index === startPosition);
    let mentions = this.state.mentions;
    const userName = this.transformTag(user.name);
    const text =
      this.props.value.substring(0, match.index) +
      `@${userName} ` +
      this.props.value.substring(
        match.index + match[0].length,
        this.props.value.length
      );
    mentions.push({
      user: {
        ...user,
        name: userName,
        startPosition: startPosition,
        test: 1000,
      },
    });
    mentions.sort((a, b) =>
      a.user.startPosition > b.user.startPosition
        ? 1
        : b.user.startPosition > a.user.startPosition
        ? -1
        : 0
    );
    this.setState(
      {
        currentCursorPosition: match.index + user.name.length + 2,
        isSuggestionsOpen: false,
        mentions,
      },
      () => this.onTextChange(text)
    );
  };
  onSelectionChange = ({
    nativeEvent,
  }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    if (nativeEvent.selection.start === nativeEvent.selection.end) {
      this.setState(
        {
          currentCursorPosition: nativeEvent.selection.start,
        },
        () => this.handleSuggestionsOpen(this.state.matches)
      );
    }
  };
  formatMarkdown = () => {
    let markdown = this.props.value;
    let parseHeadIndex = 0;
    let markdownArray = [];
    if (this.state.mentions.length === 0) {
      markdownArray.push({
        type: 'text',
        data: markdown,
      });
    }
    this.state.mentions.map((mention, index) => {
      let match = this.state.matches.find((m) => {
        return (
          m.index === mention.user.startPosition &&
          m[0] === `@${mention.user.name}`
        );
      });
      if (typeof match === 'undefined') {
        return;
      }
      markdownArray.push({
        type: 'text',
        data: markdown.substring(parseHeadIndex, mention.user.startPosition),
      });
      markdownArray.push({
        type: 'mention',
        data: `<@${mention.user.name}::${mention.user.id}>`,
      });
      parseHeadIndex =
        mention.user.startPosition + mention.user.name.length + 1;

      if (index === this.state.mentions.length - 1) {
        markdownArray.push({
          type: 'text',
          data: markdown.substring(parseHeadIndex, markdown.length),
        });
      }
    });
    markdown = '';
    markdownArray.map((m) => {
      if (m.type === 'text') {
        markdown = markdown + encodeURIComponent(m.data);
      } else if (m.type === 'mention') {
        markdown = markdown + m.data;
      }
    });
    this.props.onMarkdownChange(markdown);
  };

  renderLeftComponent = () => {
    if (typeof this.props.leftComponent !== 'undefined') {
      return this.props.leftComponent;
    } else {
      return null;
    }
  };

  renderRightComponent = () => {
    if (typeof this.props.rightComponent !== 'undefined') {
      return this.props.rightComponent;
    } else {
      return null;
    }
  };

  renderInnerComponent = () => {
    if (typeof this.props.innerComponent !== 'undefined') {
      return this.props.innerComponent;
    } else {
      return null;
    }
  };

  focus = () => {
    this.textInput?.current?.focus();
  };

  render() {
    return (
      <View>
        <View>
          {this.state.isSuggestionsOpen &&
            this.props.suggestedUsersComponent(
              this.state.suggestedUsers,
              this.handleAddMentions
            )}
          <View style={styles.inputContainerRow}>
            <View>{this.renderLeftComponent()}</View>
            <View style={[this.props.textInputStyle, styles.row]}>
              <TextInput
                ref={this.textInput}
                onFocus={() =>
                  this.props.onFocusStateChange
                    ? this.props.onFocusStateChange(true)
                    : console.log('onFocus')
                }
                onBlur={() =>
                  this.props.onFocusStateChange
                    ? this.props.onFocusStateChange(false)
                    : console.log('onFocus lost')
                }
                placeholder={this.props.placeholder}
                placeholderTextColor={this.props.placeholderTextColor}
                multiline={this.props.multiline}
                value={decodeURI(
                  this.props.value.replace(/%/g, encodeURI('%'))
                )}
                onChangeText={this.onTextChange}
                onKeyPress={this.handleDelete}
                style={[
                  this.props.textInputTextStyle,
                  styles.flex,
                  { paddingBottom: this.props.multiline ? 5 : 0 },
                ]}
                onSelectionChange={this.onSelectionChange}
              />
              {this.renderInnerComponent()}
            </View>
            {this.renderRightComponent()}
          </View>
        </View>
      </View>
    );
  }
}

export const parseMarkdown = (
  text: string,
  mentionStyle: TextStyle,
  urlStyle?: TextStyle,
  handleURL?: (url: string) => void
) => {
  const pattern = /<@[a-zA-Z0-9%_-]+::[a-f\d]{24}>/gi;
  const patternURL = /(?:(?:https?):\/\/|www\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
  let textToParse = text;
  let parsedTextArray: Array<React.ReactNode> = [];
  let parseHeadIndex = 0;
  let matches = [...matchAll(text, pattern)];

  if (matches.length === 0) {
    let currentParsable = decodeURIComponent(textToParse);
    let matchesURL = [...matchAll(currentParsable, patternURL)];
    if (matchesURL.length > 0) {
      parsedTextArray.push(
        <Text>{currentParsable.substring(0, matchesURL[0].index)}</Text>
      );
      matchesURL.map((url, index) => {
        let urlIndex = 0;
        if (typeof url.index !== 'undefined') {
          urlIndex = url.index;
        }
        parsedTextArray.push(
          <TouchableWithoutFeedback
            onPress={() => (handleURL ? handleURL(url[0]) : null)}
          >
            <Text style={urlStyle}>
              {currentParsable.substring(urlIndex, url[0].length + urlIndex)}
            </Text>
          </TouchableWithoutFeedback>
        );
        parsedTextArray.push(
          <Text>
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
      return <Text>{decodeURIComponent(textToParse)}</Text>;
    }
    return parsedTextArray;
  }
  matches.map((match, index) => {
    const matchedUser = match[0].slice(2, -1);
    const mention = {
      id: matchedUser.split('::')[1],
      name: matchedUser.split('::')[0],
    };

    let currentParsable = decodeURIComponent(
      textToParse.substring(parseHeadIndex, match.index)
    );
    let matchesURL = [...matchAll(currentParsable, patternURL)];
    if (matchesURL.length > 0) {
      parsedTextArray.push(
        <Text>{currentParsable.substring(0, matchesURL[0].index)}</Text>
      );
      matchesURL.map((url, index) => {
        let urlIndex = 0;
        if (typeof url.index !== 'undefined') {
          urlIndex = url.index;
        }
        parsedTextArray.push(
          <TouchableWithoutFeedback
            onPress={() => (handleURL ? handleURL(url[0]) : null)}
          >
            <Text style={urlStyle}>
              {currentParsable.substring(urlIndex, url[0].length + urlIndex)}
            </Text>
          </TouchableWithoutFeedback>
        );
        parsedTextArray.push(
          <Text>
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
        <Text>
          {decodeURIComponent(
            textToParse.substring(parseHeadIndex, match.index)
          )}
        </Text>
      );
    }
    parsedTextArray.push(
      <Text style={mentionStyle}>{`@${decodeURI(mention.name)}`}</Text>
    );
    if (typeof match.index === 'number') {
      parseHeadIndex = match.index + match[0].length;
    }

    if (index === matches.length - 1) {
      let lastParsable = decodeURIComponent(
        textToParse.substring(parseHeadIndex, textToParse.length)
      );
      let matchesURL = [...matchAll(lastParsable, patternURL)];
      if (matchesURL.length > 0) {
        parsedTextArray.push(
          <Text>{lastParsable.substring(0, matchesURL[0].index)}</Text>
        );
        matchesURL.map((url, index) => {
          let urlIndex = 0;
          if (typeof url.index !== 'undefined') {
            urlIndex = url.index;
          }
          parsedTextArray.push(
            <TouchableWithoutFeedback
              onPress={() => (handleURL ? handleURL(url[0]) : null)}
            >
              <Text style={urlStyle}>
                {lastParsable.substring(urlIndex, url[0].length + urlIndex)}
              </Text>
            </TouchableWithoutFeedback>
          );
          parsedTextArray.push(
            <Text>
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
          <Text>
            {decodeURIComponent(
              textToParse.substring(parseHeadIndex, textToParse.length)
            )}
          </Text>
        );
      }
    }
  });
  return parsedTextArray;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
});
