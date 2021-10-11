import React, { useCallback, useEffect, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  TextInputProps,
  TextInputSelectionChangeEventData,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import matchAll from 'string.prototype.matchall';
import { PATTERNS } from './constants';

interface Props extends TextInputProps {
  value: string;
  placeholder?: string;
  placeholderTextColor?: string;
  multiline?: boolean;
  onTextChange: (text: string) => void;
  onMarkdownChange: (markdown: string) => void;
  onFocusStateChange?: (status: boolean) => void;
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

type SuggestedUsers = {
  id: string;
  name: string;
  avatar: string;
  startPosition: number;
};

export const MentionsInput = React.forwardRef(
  (
    {
      suggestedUsersComponent,
      textInputStyle,
      onFocusStateChange = () => {},
      onTextChange = () => {},
      onMarkdownChange = () => {},
      placeholder = 'Write a message...',
      placeholderTextColor,
      multiline,
      textInputTextStyle,
      leftComponent = <></>,
      rightComponent = <></>,
      innerComponent = <></>,
      users,
      ...props
    }: Props,
    ref
  ) => {
    const [isOpen, SetIsOpen] = useState(false);
    const [suggestedUsers, SetSuggesedUsers] = useState<SuggestedUsers[]>([]);
    const [matches, SetMatches] = useState<any[]>([]);
    const [mentions, SetMentions] = useState<any[]>([]);
    const [currentCursorPosition, SetCurrentCursorPosition] = useState(0);

    useEffect(() => {
      if (props.value === '' && (mentions.length > 0 || matches.length > 0)) {
        SetMatches([]);
        SetMentions([]);
        SetCurrentCursorPosition(1);
      }
    }, [matches, mentions, props.value]);

    const transformTag = useCallback((value: string) => {
      return value
        .replace(/\s+/g, '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }, []);

    const handleSuggestionsOpen = useCallback(
      (values: RegExpMatchArray[], currentCursorPosition: number) => {
        let shouldPresentSuggestions = false;
        let newSuggestedUsers: Array<SuggestedUsers> = [];

        users.map(
          (user, index) =>
            (newSuggestedUsers[index] = {
              ...user,
              startPosition: 0,
            })
        );

        values.map((match) => {
          if (match === null) {
            return;
          }
          const matchStartPosition = match.index;
          if (typeof matchStartPosition === 'undefined') {
            return;
          }
          const matchEndPosition = matchStartPosition + match[0].length;

          if (
            currentCursorPosition > matchStartPosition &&
            currentCursorPosition <= matchEndPosition
          ) {
            shouldPresentSuggestions = true;
            newSuggestedUsers = newSuggestedUsers
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
        const isSameSuggestedUser =
          suggestedUsers.length === newSuggestedUsers.length &&
          suggestedUsers.every(
            (value, index) =>
              value.id === newSuggestedUsers[index].id &&
              value.startPosition == newSuggestedUsers[index].startPosition
          );

        SetIsOpen(shouldPresentSuggestions);
        if (!isSameSuggestedUser) {
          SetSuggesedUsers(newSuggestedUsers);
        }
      },

      [users, suggestedUsers]
    );

    const formatMarkdown = useCallback(
      (markdown: string) => {
        let parseHeadIndex = 0;
        let markdownArray = [];

        if (mentions.length === 0) {
          markdownArray.push({
            type: 'text',
            data: markdown,
          });
        }

        mentions.map((mention, index) => {
          let match = matches.find((m) => {
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
            data: markdown.substring(
              parseHeadIndex,
              mention.user.startPosition
            ),
          });
          markdownArray.push({
            type: 'mention',
            data: `<@${mention.user.name}::${mention.user.id}>`,
          });
          parseHeadIndex =
            mention.user.startPosition + mention.user.name.length + 1;

          if (index === mentions.length - 1) {
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
        onMarkdownChange(markdown);
      },
      [onMarkdownChange, mentions, matches]
    );

    const handleDelete = useCallback(
      ({ nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (nativeEvent.key === 'Backspace') {
          mentions.map((mention, index) => {
            const matchStartPosition = mention.user.startPosition;
            const matchEndPosition =
              matchStartPosition + mention.user.name.length + 1;
            if (
              currentCursorPosition > matchStartPosition &&
              currentCursorPosition <= matchEndPosition
            ) {
              const newMentions = mentions;
              newMentions.splice(index, 1);
              SetMentions(newMentions);
            }
          });
        }
      },
      [mentions, currentCursorPosition]
    );

    const onSelectionChange = useCallback(
      ({
        nativeEvent,
      }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
        if (nativeEvent.selection.start === nativeEvent.selection.end) {
          SetCurrentCursorPosition(nativeEvent.selection.start);
        }
      },
      []
    );

    const handleMentions = useCallback(
      (newText: string, currentCursorPosition: number) => {
        const pattern = PATTERNS.USERNAME_MENTION;

        let newMatches = [...matchAll(newText, pattern)];
        let newMentions = newText.length > 0 ? mentions : [];

        newMentions.map((mention) => {
          const matchStartPosition = mention.user.startPosition;

          if (decodeURI(newText).length - decodeURI(props.value).length > 0) {
            if (
              matchStartPosition + (newText.length - props.value.length) >
                currentCursorPosition &&
              currentCursorPosition !== props.value.length
            ) {
              mention.user.startPosition =
                mention.user.startPosition +
                (newText.length - props.value.length);
            }
          } else {
            if (matchStartPosition >= currentCursorPosition) {
              mention.user.startPosition =
                mention.user.startPosition +
                (newText.length - props.value.length);
            }
          }
          return mention;
        });

        onTextChange(newText);
        formatMarkdown(newText);

        const isSameMatch =
          matches.length === newMatches.length &&
          matches.every((value, index) => value === newMatches[index]);

        SetMentions(newMentions);

        if (!isSameMatch) {
          SetMatches(newMatches);
        }
      },
      [mentions, onTextChange, formatMarkdown, props.value, matches]
    );

    const onChangeText = useCallback(
      (newText: string) => {
        handleMentions(newText, currentCursorPosition);
      },
      [handleMentions, currentCursorPosition]
    );

    const handleAddMentions = useCallback(
      (user: {
        id: number;
        name: string;
        avatar: string;
        startPosition: number;
      }) => {
        const startPosition = user.startPosition;
        const mention = mentions.find(
          (m) => m.user.startPosition === startPosition
        );
        if (mention) {
          return;
        }

        const match = matches.find((m) => m.index === startPosition);
        let newMentions = mentions;
        const userName = transformTag(user.name);
        const newText =
          props.value.substring(0, match.index) +
          `@${userName} ` +
          props.value.substring(
            match.index + match[0].length,
            props.value.length
          );

        newMentions.push({
          user: {
            ...user,
            name: userName,
            startPosition: startPosition,
            test: 1000,
          },
        });
        newMentions.sort((a, b) =>
          a.user.startPosition > b.user.startPosition
            ? 1
            : b.user.startPosition > a.user.startPosition
            ? -1
            : 0
        );

        SetMentions(newMentions);
        SetIsOpen(false);
        const newCursor = match.index + user.name.length + 1;
        SetCurrentCursorPosition(newCursor);
        setTimeout(() => {
          handleMentions(newText, newCursor);
        }, 100);
      },
      [mentions, matches, transformTag, props.value, handleMentions]
    );

    const onFocus = useCallback(() => {
      onFocusStateChange(true);
    }, [onFocusStateChange]);

    const onBlur = useCallback(() => {
      onFocusStateChange(false);
    }, [onFocusStateChange]);

    useEffect(() => {
      formatMarkdown(props.value);
    }, [props.value, formatMarkdown]);

    useEffect(() => {
      let timeout = setTimeout(() => {
        handleSuggestionsOpen(matches, currentCursorPosition);
      }, 100);

      return () => clearTimeout(timeout);
    }, [handleSuggestionsOpen, matches, currentCursorPosition]);

    return (
      <View>
        <View>
          {isOpen && suggestedUsersComponent(suggestedUsers, handleAddMentions)}
          <View style={styles.inputContainerRow}>
            <View>{leftComponent}</View>
            <View style={[textInputStyle, styles.row]}>
              <TextInput
                {...props}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                multiline={multiline}
                value={decodeURI(props.value.replace(/%/g, encodeURI('%')))}
                onChangeText={onChangeText}
                onKeyPress={handleDelete}
                style={[
                  textInputTextStyle,
                  styles.flex,
                  { paddingBottom: multiline ? 5 : 0 },
                ]}
                onSelectionChange={onSelectionChange}
                //@ts-ignore
                ref={ref}
              />
              {innerComponent}
            </View>
            {rightComponent}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
});
