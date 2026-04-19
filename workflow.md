## User Flow
1) Signup -> give onBoarding data (demographics & Image) 

2) Signin -> Search -> using the search get the data from the promt and choose the products (Human Wearables)

3) VTryon -> Image -> selects from choices or search new and choose -> generate VTryon Imnge -> using a websocket connections shows current progreress using a job based using a radis cache, [backend] uses a a thirdparty(Claid.ai) provider to generate the image and uses a worker to talk with the provider and after finishing update the radis and database with job done, tryon Image schema and send the data to the frontedn with the socket connection

4) VTryon -> Model -> selects images from image tryons -> generate VTryon 3d model -> using a websocket connections shows current progreress using a job based using a radis cache, [backend] uses a a thirdparty(Pixazo) provider to generate the image and uses a worker to talk with the provider and after finishing update the radis and database with job done, tryon Image schema and send the data to the frontedn with the socket connection

5) Trending -> when users creates a tryon image ort 3d model they can mark it as make public and after that others can visit that page and see and click one to see details and do tryon on that and the `VTryon -> Image and VTryoon -> Model` will be happen for them, using a state management in zustand for this

6) Discover -> users can see what other others are searching for and in the hero section of the page some recomendations will be made for the user.

7) Sharing -> users can share their tryon results with a link to others (facebook, instagram, X, messenger, etc.)

8) Dashboard -> users can see all their uses previuous tryons, searches, favourites, liked (from treding and discovary), change Image, Name, email, Password, demographic data, change profile image, see their publily availabe tryons etc.