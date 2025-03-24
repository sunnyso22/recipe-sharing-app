# Recipe Sharing App

https://cookery.sunnyso22.dev/
Cookery is a recipe sharing website built by Next.js + MongoDB. Deployed by Vercel.

## Main Features

1. Search Recipes
2. Hot recipes are classified by the number of likes
3. Login function (Clerk)
4. Create Recipes
5. Update Recipes
6. Delete Recipes
7. Like Button and Bookmark Button
    - The liked/bookmarked recipes are stored as metedata in Clerk
    - Store the recipe Id only
8. Share Button
    - Allow users to copy the URL, or share the recipes to social media

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

## Major Challenges

1. Form validation with using the hook `useAcionState`
2. Update metadata to Clerk
3. Nested Link in Card component
4. Implement Incremental Static Regeneration(ISR)
5. Fix the search bar which show the serach result instantly

## Known Issues

1. ClerkProvider component forces all the children to be rendered dynamically which affect the performance
2. Delete recipe but the metadata (like list and bookmark list) in Clerk is not being deleted
3. Recipes images are directly being stored in MongoDB with Base64 format

## Future Enhancements

1. S3 storage for recipes images
2. Advanced search and filters
3. Additional social Feature, e.g. comments
4. Add a personal page
