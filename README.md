# NewsPaper-like site with 2 frontend sites. 1 for authors and another for Readers. 2 separate APIs for 2 different frontends.

## Specialities

- Authors can CRUD profile on https://author-of-good-news.onrender.com/
- Also authors can create, edit, update, and delete posts
- Similarly Readers can CRUD profile on https://the-good-news.onrender.com/
- Readers need a profile to comment. They can only post comments (can't update or delete, don't want to spend time on that <: )

## Difficulties or Learnings

- Setting up JWT for authentication and later allowing Refresh-token to remain authenticated for up to 10 days. Especially setting cookies, while the front-end is different and 2(TWO) in number.
- Uploading files with Multer on the live server like render.com
- Setting up tinyMCE
- Condition on React Router
- .env setup for easier development

## Shortcomings

- [The live site is hosted on free hosting of render.com. Because of that, the backend goes down when there is no active request. Also later when there is a new request the backend service restarts.](https://community.render.com/t/why-my-images-are-not-showing-when-i-deployed-to-render-after-visiting-the-site-after-long-time/7412/3)
- Because of the above, Refresh-token will not work if the service restarts. Visitors have to log in again.
- If a new thumbnail is uploaded, it will get deleted if the backend restarts.

## Tools used in Backend(https://github.com/syedshaon/blog-backend)

- Express
- mongoose
- passport-jwt
- bcryptjs
- cookie-parser
- cors
- dotenv

## Tools used in Front-End(https://github.com/syedshaon/blogApi-ReaderFrontEnd, https://github.com/syedshaon/blogApi-AuthorFrontEnd)

- react
- react-router
- redux toolkit
- tailwindcss
- tinymce

## APIs

- For Readers: https://the-good-news.onrender.com/blogsAPI on render.com, http://localhost:3000/blogsAPI on development
- For Authors: https://the-good-news.onrender.com/authorAPI" on render.com, http://localhost:3000/authorAPI on development

## Live Sites

- For Readers: https://the-good-news.onrender.com/
- For Authors: https://author-of-good-news.onrender.com/
