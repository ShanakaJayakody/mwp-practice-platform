# MedwithPurpose UCAT Practice Platform

A comprehensive platform for UCAT practice with focus groups, tests, and performance tracking.

## Project Structure

The platform has been refactored to use a modular structure:

### CSS

- `css/mwp-styles.css`: Shared stylesheets with common styles including variables, layout containers, buttons, forms, and accessibility features.

### JavaScript Modules

- `js/auth.js`: Authentication module for handling user login/logout with Firebase.
- `js/ui-components.js`: UI components module with reusable interface elements and interactions.
- `js/data-service.js`: Data service module for Firebase Firestore interactions.

### HTML Pages

- `student_dashboard.html`: Main dashboard for students to access tests and view results.
- `focus_groups.html`: Page for accessing focus group practice sessions.
- `admin.html`: Admin panel for managing student data and results.
- Test pages: Individual test pages for different UCAT sections.

## Usage

1. Include the required CSS and JavaScript modules in your HTML:

```html
<link rel="stylesheet" href="css/mwp-styles.css">

<script defer src="js/auth.js"></script>
<script defer src="js/ui-components.js"></script>
<script defer src="js/data-service.js"></script>
```

2. Initialize the modules in your JavaScript:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth module
    MWPAuth.initialize();
    
    // Initialize UI components
    MWPUI.initialize();
    
    // Initialize data service
    MWPData.initialize();
    
    // Add auth state listener
    MWPAuth.onAuthStateChanged(function(user) {
        // Handle auth state changes
    });
});
```

## Firebase Configuration

The platform uses Firebase for authentication and data storage. Make sure the Firebase configuration is properly set up in the authentication module.

## Accessibility Features

The platform includes several accessibility enhancements:

- Keyboard navigation support
- ARIA attributes for screen readers
- Skip-to-content links
- Focus management
- Semantic HTML structure

## Future Improvements

- Implement loading state indicators
- Add more test types
- Enhance mobile responsiveness
- Add internationalization support 