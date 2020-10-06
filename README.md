# @lowkey/react-native-mentions-input

Mentions input

## Installation

```sh
npm install @lowkey/react-native-mentions-input
```

## Usage

```js
import MentionsInput, {parseMarkdown} from '@lowkey/react-native-mentions-input';

// ...

<MentionsInput
    value={value}
    onTextChange={onChangeText}
    onMarkdownChange={(markdown: string) => setMarkdown(markdown)}
    mentionStyle={styles.mentionStyle}
    textInputStyle={styles.textInputStyle}
    users={[
      {
        id: '5f5f2b120a958f2e6b2ff0d1',
        name: 'The Maximus The Bestus',
        avatar:
          'https://images.pexels.com/photos/1561020/pexels-photo-1561020.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=50',
      },
    ]}
    suggestedUsersComponent={(users, addMentions) => (
      <View
        style={{
          alignSelf: 'stretch',
          backgroundColor: '#fff',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          position: 'absolute',
          top: -(USER_ITEM_HEIGHT * users.length),
          left: 0,
          right: 0,
        }}
      >
        {users.map((user: any) => (
          <TouchableOpacity onPress={() => addMentions(user)}>
            <View key={user.id} style={styles.suggestedUserComponentStyle}>
              <Image
                source={{ uri: user.avatar }}
                style={styles.suggestedUserComponentImageStyle}
              />
              <Text>{user.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )}
/>

// Raw markdown
<View style={styles.exampleContainer}>
    <Text style={styles.exampleHeader}>Markdown</Text>
    <Text>{markdown}</Text>
</View>

      // Parsed text
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleHeader}>Parsed Text</Text>
        <Text>{parseMarkdown(markdown, styles.mentionStyle)}</Text>
      </View>

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    textInputStyle: {
        backgroundColor: '#fff',
        width: width * 0.8,
        height: USER_ITEM_HEIGHT,
        borderRadius: 5,
        paddingHorizontal: 10,
        borderColor: '#c1c1c1',
        borderWidth: StyleSheet.hairlineWidth,
    },
    suggestedUserComponentImageStyle: {
        width: USER_ITEM_HEIGHT * 0.65,
        height: USER_ITEM_HEIGHT * 0.65,
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        marginRight: 5,
    },
    suggestedUserComponentStyle: {
        alignItems: 'center',
        paddingHorizontal: 10,
        height: USER_ITEM_HEIGHT,
        flexDirection: 'row',
    },
    mentionStyle: {
        fontWeight: '500',
        color: 'blue',
    },

    // Example styles
    sendButtonStyle: {
        marginTop: 20,
        width: 100,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#efefef',
        borderRadius: 15,
    },
    exampleContainer: {
        alignSelf: 'stretch',
        flexDirection: 'column',
        paddingHorizontal: 30,
        marginVertical: 30,
    },
    exampleHeader: {
        fontWeight: '700',
    }
});

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

Any usage allowed with written permission only
