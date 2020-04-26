# GET `/login`
## Query
```json
{
    "email": "<someEmail>",
    "psw": "<somePassword>"
}
```
## Response
```json
{
    "id": "<someUserId>",
    "name": "<someName>",
    "email": "<someEmail>"
}
```
## Error
```json
{
    "message": "Incorrect email or password"
}
```


# PUT `/register`
## Body
```json
{
    "email": "<someEmail>",
    "name": "<someName>",
    "psw": "<somePassword>"
}
```
## Response
```json
{
    "id": "<someUserId>",
    "email": "<someEmail>",
    "name": "<someName>",
    "psw": "<somePassword>"
}
```
## Error
```json
{
    "message": "Email <someEmail> already exists | Invalid email | Invalid password"
}
```

# GET `/user/:userId`
## Query
```
empty
```
## Response
```json
{
    "id": "<someUserId>",
    "name": "<someName>",
    "email": "<someEmail>"
}
```
## Error
```json
{
    "message": "Unknown userId"
}
```


# GET `/user/:userId/groups`
## Query
```json
{
    "page": "<nr>",
    "filterOptions": {"opt": "val"}
}
```
## Response
```json
{
    "page": "<nr>",
    "count": "<listLength>",
    "startIndex": "<index>",
    "endIndex": "<index>",
    "pagesLeft": "true | false",
    "groups": [
        {
            "id": "<someGroupId>",
            "name": "<someGroupName>",
            "text": "<someGroupDescription>",
            "public": "true | false",
            "isModerator": "true | false",
            "lastMessageSince": "<someTimestamp>",
            "moderators": [
                  {
                    "id": "<someUserId>",
                    "name": "<someUserName>"
                  }     
            ] 
        }
    ]
}
```
## Error
```json
{
  "message": "Unknown userId"
}
```


# PUT `/user/:userId/groups`
## Body
```json
{
   "id": "<someGroupId>"
}
```
## Response
```json
{
    "id": "<someGroupId>",
    "name": "<someGroupName>",
    "text": "<someGroupDescription>",
    "public": "true | false",
    "isModerator": "true | false",
    "lastMessageSince": "<someTimestamp>",
    "moderators": [
        {
            "id": "<someUserId>",
            "name": "<someUserName>"
        }     
    ] 
}
```
## Error
```json
{
  "message": "Unknown userId | Unknown groupId"
}
```


# GET `/groups`
## Query
```json
{
  "name": "<someGroupName>",
  "page": "<nr>"
}
```
## Response
```json
{
    "page": "<nr>",
    "count": "<listLength>",
    "startIndex": "<index>",
    "endIndex": "<index>",
    "pagesLeft": "true | false",
    "groups": [
        {
            "id": "<someGroupId>",
            "name": "<someGroupName>",
            "text": "<someGroupDescription>",
            "public": "true | false",
            "moderators": [
                  {
                    "name": "<someUserName>",
                    "email": "<someUserMail>"
                  }     
            ] 
        }
    ]
}
```


# PUT `/groups`
## Body
```json
{
    "name": "<someGroupName>",
    "text": "<someGroupDescription>",
    "public": "true | false",
    "moderators": [
        "<someEmail>"
    ]
}
```
## Response
```json
{
    "id": "<someGroupId>",
    "name": "<someGroupName>",
    "text": "<someGroupDescription>",
    "public": "true | false",
    "moderators": [
        {
            "id": "<someUserId>",
            "name": "<someUserName>"
        }     
    ] 
}
```
## Error
```json
{
  "message": "Unknown email"
}
```


# GET `/groups/:groupId/questions?page=<nr>`
## Body
```json
{
    "userId": "<someUserId>",
    "filterOptions": {"opt": "val"}
}
```
## Response
```json
{
    "page": "<nr>",
    "count": "<listLength>",
    "startIndex": "<index>",
    "endIndex": "<index>",
    "pagesLeft": "true | false",
    "questions": [
        {
            "id": "<someMessageId>",
            "title": "<someTitle>",
            "text": "<someDescription>",
            "postedOn": "<someTimestamp>",
            "isAuthor": "true | false",
            "newestAnswerSince": "<someTimestamp>",
            "upvotes": "<count>",
            "hasUpvoted": "-1 | 0 | 1",
            "answers": "<count>",
            "hints": "<count>",
            "tags": [
                "<someTag>"    
            ]
        }
    ]
}
```
## Error
```json
{
    "message": "Unknown groupId | Unknown userId"
}
```


# PUT `/groups/:groupId/questions`
## Body
```json
{
    "title": "<someTitle>",
    "text": "<someDescription>",
    "author": "<someUserId>",
    "tags": [
        "<someTag>"    
    ]
}
```
## Response
```json
{
    "id": "<someMessageId>",
    "title": "<someTitle>",
    "text": "<someDescription>",
    "group": "<groupId>",
    "author": "<someUserId>",
    "tags": [
        "<someTag>"    
    ]
}
```
## Error
```json
{
    "message": "Unknown groupId | Unknown author"
}
```


# GET `/message/:messageId`
## Body
```json
{
    "userId": "<someUserId>"
}
```
## Response
```json
{
    "id": "<someMessageId>",
    "title": "<someTitle>",
    "text": "<someDescription>",
    "group": "<groupId>",
    "nestedIn": "undefined | <messageId>",
    "postedOn": "<someTimestamp>",
    "isAuthor": "true | false",
    "newestAnswerSince": "<someTimestamp>",
    "upvotes": "<count>",
    "hasUpvoted": "-1 | 0 | 1",
    "tags": [
        "<someTag>"    
    ]
}
```
## Error
```json
{
    "message": "Unknown messageId | Unknown userId"
}
```


# GET `/message/:messageId/answers?page=<nr>`
## Body
```json
{
    "type": "hint | answer | both",
    "userId": "<someUserId>",
    "filterOptions": {"opt": "val"}
}
```
## Response
```json
{
    "page": "<nr>",
    "count": "<listLength>",
    "startIndex": "<index>",
    "endIndex": "<index>",
    "pagesLeft": "true | false",
    "answers": [
        {
            "id": "<someMessageId>",
            "title": "<someTitle>",
            "type": "hint | answer",
            "text": "<someDescription>",
            "postedOn": "<someTimestamp>",
            "isAuthor": "true | false",
            "upvotes": "<count>",
            "hasUpvoted": "-1 | 0 | 1",
            "tags": [
                "<someTag>"    
            ]
        }
    ]
}
```
## Error
```json
{
    "message": "Unknown messageId | Unknown userId"
}
```

# PUT `/message/:messageId/answers`
## Body
```json
{
    "title": "<someTitle>",
    "text": "<someDescription>",
    "author": "<someUserId>",
	"type": "Hint | Answer",
    "tags": [
        "<someTag>"    
    ]
}
```
## Response
```json
{
    "id": "<someMessageId>",
    "title": "<someTitle>",
    "text": "<someDescription>",
    "group": "<groupId>",
    "nestedIn": "<messageId>",
    "author": "<someUserId>",
    "tags": [
        "<someTag>"    
    ]
}
```
## Error
```json
{
    "message": "Unknown messageId | Unknown userId"
}
```

# PUT `message/:messageId/upvotes`
## Body
```json
{
    "value": "-1 | 0 | 1",
    "user": "<someUserId>"
}
```
note: value = 0 is equivalent aan upvote verwijderen,
value = 1 (-1) terwijl er al een upvote met value -1 (1) bestaat voor dezelfde user
past de waarde aan in de databank ipv een nieuwe upvote aan te maken.
## Response
```
ok
```
## Error
```json
{
    "message": "Unknown messageId | Unknown userId"
}
```

# DELETE `user/:userId`
# DELETE `group/:groupId`
# DELETE `message/:messageId`
note : verwijder ook alle gerelateerde data.

# PATCH `user/:userId`
# PATCH `group/:groupId`
# PATCH `message/:messageId`