<p align="center">
  <a href="https://www.gatsbyjs.com">
    <img alt="Gatsby" src="https://www.gatsbyjs.com/Gatsby-Monogram.svg" width="60" />
  </a>
</p>
<h1 align="center">
  Gatsby Source Strapi With Schema
</h1>

Gatsby source plugin for pulling documents from strapi API

## Installing the plugin

Since the plugin is not yet registered in a package manager, at the moment the way to install it is by cloning this repository in the plugins folder of your project, after that you need to build it 

~~~bash
npm run build
~~~

~~~text
/my-gatsby-site
├── /plugins
│   └── /gatsby-source-strapi-schema
├── /src
│   └── /pages
│       └── /index.js
├── gatsby-config.js
├── gatsby-node.js
└── package.json
~~~

## Setting up the plugin

You can enable and configure this plugin in your `gatsby-config.js` file.

### Basic Usage:

This plugin requires at least `findcomponents` and `findcontenttypes` permission. Also requires `findone` permission for each `collection` and  `Single Type`. Also it is advisable to include all types of content connected through `relation types` to avoid problems


~~~js
// gatsby-config.js
module.exports = {
  ...
  plugins: [
    ... // Other plugins
    {
      resolve: "gatsby-source-strapi-schema",
      options: {
        apiURL: "http://localhost:1337",
        collectionTypes: ["article", "category", "Writer"],
        singleTypes: ["global", "homepage"]
      }
    }
  ]
}
~~~

### Advanced usage:

#### Authenticated requests

Strapi's [Roles & Permissions plugin](https://strapi.io/documentation/developer-docs/latest/development/plugins/users-permissions.html#concept) allows you to protect your API actions. If you need to access a route that is only available to a logged in user, you can provide your credentials so that this plugin can access to the protected data.

~~~js
// gatsby-config.js
module.exports = {
  ...
  plugins: [
    ... // Other plugins
    {
      resolve: "gatsby-source-strapi-schema",
      options: {
        apiURL: "http://localhost:1337",
        loginData: {
          identifier: "", // May be userName or email
          password: "" // Password
        },
        collectionTypes: ["article", "category", "Writer"],
        singleTypes: ["global", "homepage"]
      }
    }
  ]
}
~~~

#### Custom endpoints

By default, we use the pluralize package to deduct the endpoint that matches a collection type. You can opt out of this behavior. To do so, pass an entity definition object with your custom endpoint.

~~~js
// gatsby-config.js
module.exports = {
  ...
  plugins: [
    ... // Other plugins
    {
      resolve: "gatsby-source-strapi-schema",
      options: {
        apiURL: "http://localhost:1337",
        collectionTypes: [
          {
            name: "post",
            endpoint: "articles"
          }, 
          "category",
          { 
            name: "author",
            endpoint: "Writer"
          }
        ],
        singleTypes: ["global", "homepage"]
      }
    }
  ]
}
~~~

#### Internationalization support

By default, this plugin will only fetch data in the default locale of your Strapi app. If your content types are available in different locales, you can also pass an entity definition object to specify the locale you want to fetch for a content type. Use the all value to get all available locales on a collection type.

~~~js
// gatsby-config.js
module.exports = {
  ...
  plugins: [
    ... // Other plugins
    {
      resolve: "gatsby-source-strapi-schema",
      options: {
        apiURL: "http://localhost:1337",
        collectionTypes: [
          // Fetch all locales for collection-name
          {
            name: "article",
            api: { qs: { _locale: `all` } }
          },
          // Only fetch english content for other-collection-name
          {
            name: "category",
            api: { qs: { _locale: `en` } }

          },
          // Combined with a custom endpoint
          {
            name: "author",
            endpoint: "writer",
            api: { qs: { _locale: `en` } }
          }
        ],
        singleTypes: ["global", "homepage"]
      }
    }
  ]
}
~~~

For single types, the all value will not work, since single type queries do not return an array. If you want a single type to be available in different locales, add several entity definition objects for that same single type. The source plugin will merge them together, so you can access the right locale in your queries using the locale filter.

~~~js
// gatsby-config.js
module.exports = {
  ...
  plugins: [
    ... // Other plugins
    {
      resolve: "gatsby-source-strapi-schema",
      options: {
        apiURL: "http://localhost:1337",
        collectionTypes: ["article", "category", "Writer"],
        singleTypes: [
          "global", 
          {
            name:"homepage",
            api: { qs: { _locale: "en" } }
          }, 
          {
            name:"homepage",
            api: { qs: { _locale: "es" } }
          }
        ]
      }
    }
  ]
}
~~~

#### Api Endpoints (Publication State)

Queries to Strapi Content API can use several API parameters, all documentation can be found [here](https://strapi.io/documentation/developer-docs/latest/developer-resources/content-api/content-api.html#api-parameters)

~~~js
// gatsby-config.js
module.exports = {
  ...
  plugins: [
    ... // Other plugins
    {
      resolve: "gatsby-source-strapi-schema",
      options: {
        apiURL: "http://localhost:1337",
        collectionTypes: [
          {
            name: "article",
            // 'preview' fetches both draft & published content
            api: { qs: { _publicationState: "preview"} }
          },
          "category",
          "Writer"
        ],
        singleTypes: ["global", "homepage"]
      }
    }
  ]
}
~~~

## Querying data

You can query created nodes from your Gatsby Graphql Api like the following:

~~~graphql
{
  allStrapiArticle {
    nodes{
      id
      title
      slug
    }
  }
}
~~~

You can filter created nodes using graphql filters as described in [Gatsby documentation](https://www.gatsbyjs.com/docs/graphql-reference/#filter)

~~~graphql
{
  allStrapiArticle(filter: { category: { strapiId: { eq: 4 } } }) {
    nodes {
      id
      title
      slug
    }
  }
}
~~~

You can query images to be used with [Gatsby image](https://www.gatsbyjs.com/plugins/gatsby-image/)

~~~graphql
{
  allStrapiArticle {
    nodes {
      id
      title
      image {
        id
        name
        alternativeText
        caption
        localFile {
          childImageSharp {
            gatsbyImageData
          }
        }
      }
    }
  }
}
~~~

You can use fragments to query reusable components

~~~graphql
fragment seo on StrapiComponentSharedSeo {
  id
  metaTitle
  metaDescription
  shareImage {
    id
    alternativeText
    name
    localFile {
      childImageSharp {
        gatsbyImageData
      }
    }
  }
}

query Home {
  strapiHomepage {
    id
    seo {
      ...seo
    }
  }
}

query Articles {
  allStrapiArticle {
    nodes {
      id
      title
      seo {
        ...seo
      }
    }
  }
}
~~~