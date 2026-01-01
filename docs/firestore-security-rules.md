# Firestore Security Rules for Creators Feature

## Collections

### `creators` Collection

**Read Access:** Public (anyone can read)
**Write Access:** Admin only (via Firebase Admin SDK)

```javascript
match /creators/{creatorId} {
  allow read: if true; // Public read access
  allow write: if false; // Only admin can write (via Admin SDK)
}
```

### `creator_followers` Collection

**Read Access:** Users can read their own follow relationships
**Write Access:** Users can create/delete their own follow relationships

```javascript
match /creator_followers/{followerId} {
  // Allow users to read their own follow relationships
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  
  // Allow users to create their own follow relationships
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.creatorId is string;
  
  // Allow users to delete their own follow relationships
  allow delete: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  
  // No updates allowed (only create/delete)
  allow update: if false;
}
```

## Implementation

These rules should be added to your Firebase Console under:
**Firestore Database → Rules**

Note: The `creators` collection writes are handled server-side via Firebase Admin SDK, so client-side write rules can be set to `false` for security.

