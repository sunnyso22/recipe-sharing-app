# Recipe Sharing App

Cookery is a recipe sharing website built by Next.js + MongoDB. Deployed by Vercel.\
https://cookery.sunnyso22.dev/

## Main Features

1. Home Page
    - Search Function
    - Display Hot recipes (ordered by the number of likes)
2. Recipes Page
    - Display all recipes
    - Users can click any recipe to view the details
        - Like Button
        - Bookmark Button
        - Share Button to copy recipe link or share to social media
3. Cookbook Page (appear after login)
    - Create Recipes
        - A form for user to upload an image, and
        - title, description, ingredients, etc
    - Manage My Recipes
        - Users can view all the published receipes
        - They can **Update Recipes** or **Delete Recipes**
    - Bookmarked Recipes
        - User can view their bookmarked recipes
4. Login Page (Clerk)

## Technical Details

1. Clerk as user + auth management
2. MongoDB as NoSQL DB to store the recipe data
3. Next.js for fullstack development
    - Frontend
        - Tailwindcss for styling
        - Using shadcn/ui as component library for creating different interactive component, such as RecipesCard, Recipe Upload, Buttons, etc
        - Using dynamic routes for showing each recipe datail
        - Clerk frontend API to retrieve the auth status and metadata (like/bookmark list)
        - Using Clerk middleware to do route protection
    - Backend
        - Action script for retriving and sending data from/to MongoDB (find, findOne, insertOne, updateOne, createOne)
        - Function for update metadata to Clerk using Clerk backend API
        - The liked/bookmarked recipes are stored as metedata in Clerk

## Major Challenges

1. Form validation with the `useAcionState` hook
    - Problem: I wasn’t familiar with the `useAcionState` in React
    - Solution: I explored [online resources](https://www.youtube.com/watch?v=4-3K7SgoVf4&list=PLC3y8-rFHvwhIEc4I4YsRz5C7GOBnxSJY&index=76) and the official [React document](https://react.dev/reference/react/useActionState) to learn how it works and implemented it successfully.
2. Retrieving Metadata from Clerk
    - Problem: I couldn’t fetch metadata from Clerk.
    - Solution: After reviewing [Clerk’s official documentation](https://clerk.com/docs/hooks/use-user), I realized I was using the backend API incorrectly. I adjusted my approach based on the docs.
3. Nested Links in the Recipe Card Component
    - Problem: The Recipe Card has a link to the recipe details page, but the "Like" button inside the card wasn’t clickable due to overlapping links.
    - Solution: I researched articles from [CSS-Tricks](https://css-tricks.com/nested-links/) and [Cards](https://inclusive-components.design/cards/). I fixed it by setting the `<Card />` element to position `relative`, adding pseudo-element (::after) with `after:absolute after:inset: 0` to the main link to cover the card, and giving the "Like" button link a position `relative`. This resolved the nested link conflict.
4. Implementing Incremental Static Regeneration (ISR)
    - Problem: I wanted to pre-render the recipe detail pages at build time but wasn’t sure how to set it up.
    - Solution: I studied [Next.js ISR documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration), which provided helpful examples. I used `generateStaticParams` and the `revalidate` option to implement ISR effectively.
5. Instant Search Results in the Search Bar
    - Problem: My earlier search bar worked but didn’t show results instantly as users typed, which was my goal.
    - Solution: I followed the [Next.js - Adding Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) tutorial, which offered a clear guide to build an instant search feature.
6. GridFS implementation
    - Problem: Storing recipe images as Base64 in MongoDB slowed down the site, so I tried GridFS, but it was tougher to implement than expected.
    - Solution: I used AI tools like Grok and v0.dev, which provided GridFS examples and helped me debug my code effectively.

## Known Issues

1. ClerkProvider component forces all the children to be rendered dynamically which affect the performance
2. Delete recipe but the metadata (like list and bookmark list) in Clerk is not being deleted

## Future Enhancements

1. S3 storage for recipes images
2. Advanced search and filters
3. Additional social Feature, e.g. comments
4. Add a personal page
