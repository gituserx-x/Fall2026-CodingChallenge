import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:5001/api';

// blueprint for what every imageItem should hold
interface ImageItem {
  id: string;
  url: string;
  tags: string;
  note: string;
}

// blueprint for what every collection should hold
interface Collection {
  id: string;
  name: string;
  images: ImageItem[];
}

// App = react component, responsible for creating ui
// returns the Ui that react should display
function App() {


  // use state = react hook, reminds that components can change while app is running (ie user text input can change, 
  // collections can change)
  // collections = current value, setCollections = function used to change that value, 
  // useState stores array of collections, initially empty
  const [collections, setCollections] = useState<Collection[]>([]);
  
  //newCollectionName = current text, setNewColletionName = changes the text
  // useState stores text user is actively typing
  const [newCollectionName, setNewCollectionName] = useState('');

  //selectedCollection holds collection selected by user
  //set changes this selection
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // holds and changes what user types into IMAGE SEARCH box
  const [searchTerm, setSearchTerm] = useState('');

  // holds true or false whether the search bar is open 
  const [searchOpen, setSearchOpen] = useState(false);

  // remembers what PIXABAY found - prevents found images from just being thrown away
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // react remembers this pixabay image got clicked save on
  const [imageToSave, setImageToSave] = useState<any | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  // holds the "image saved!" message
  const [showSavedPopup, setShowSavedPopup] = useState(false);

  // edit saved images (notes and tags)
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);

  // edit saved collections (names)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // holds collection ID someone is viewing thru shared link 
  const [sharedCollection, setSharedCollection] = useState<Collection | null>(null);


  // Load collections when the page first loads
  // runs fetchCollections (talks to backend) in RESPONSE to the app first loading
  // allows existing collections to be automatically loaded when you open the page
  useEffect(() => {
    fetchCollections();
  }, []);



  useEffect(() => {
  const pathParts = window.location.pathname.split('/');

      if (pathParts[1] === 'share' && pathParts[2]) {
          fetch(`${API_URL}/collections/${pathParts[2]}`)
            .then(res => res.json())
            .then(data => setSharedCollection(data))
            .catch(err => console.error('Error fetching shared collection:', err));
      }
  }, []); 




  // frontend communicates w backend
  function fetchCollections() {
    // uses GET by default for http address
    fetch(`${API_URL}/collections`)
    // wait for backend to respond, then take response and from json data to JS object
      .then(res => res.json())
      // once converted, take the data and put it into the collections state (changeable)
      // Ui is rerendered 
      .then(data => setCollections(data))
      //catches if there is an error with retreiving data from backend
      .catch(err => console.error('Error fetching collections:', err));
  }




  // connects button search on site to actual search
  // calls image search API
  async function searchImages() {
  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${import.meta.env.VITE_PIXABAY_API_KEY}&q=${encodeURIComponent(searchTerm)}&image_type=photo`
    );

    const data = await response.json();

    setSearchResults(data.hits);
  } catch (error) {
    alert(`Error: ${error}`);
  }
}




  // creates new collection when user clicks button
  function createCollection() {
    // if user doesn't enter valid name, stop the function & don't send request
    if (!newCollectionName.trim()) return;

    fetch(`${API_URL}/collections`, {
      // gives fetch instructions for request
      // tells backend, sending something bc want you to CREATE something
      method: 'POST',
      // tells backend data being sent is JSON formatted
      headers: { 'Content-Type': 'application/json' },
      // actual data being sent 
      // .stringify converts javascript object into JSON text
      body: JSON.stringify({ name: newCollectionName })
    })
    // wait for backend's response, then convert it from JSON back to JS
      .then(res => res.json())
      // next part doesn't use response data
      .then(() => {
        // clears input box
        setNewCollectionName('');
        // gets updated list of collections from backend
        fetchCollections();
      })
      // if the POST/ front-back communication fails
      .catch(err => console.error('Error creating collection:', err));
  }







  async function saveImageToCollection(collectionId: string) {
  if (!imageToSave) return;

  try {
    const response = await fetch(`${API_URL}/collections/${collectionId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: imageToSave.webformatURL,
        tags: imageToSave.tags,
        note: ''
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save image');
    }

    setImageToSave(null);
    setSaveMessage('Image saved!');
    setShowSavedPopup(true);
    fetchCollections();   

  } catch (error) {
    console.error('Error saving image:', error);
  }
}








async function updateImage() {
  if (!editingImage) return;

  const collection = selectedCollection || sharedCollection;

  if (!collection) return;

  try {
    const response = await fetch(
      `${API_URL}/collections/${collection.id}/images/${editingImage.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: editingImage.tags,
          note: editingImage.note
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update image');
    }

    setEditingImage(null);

    const updatedCollections = await fetch(
      `${API_URL}/collections`
    ).then(res => res.json());

    setCollections(updatedCollections);

    const updatedCollection = updatedCollections.find(
      (collection: Collection) => collection.id === collection.id
    );

    if (selectedCollection) {
      setSelectedCollection(
        updatedCollections.find(
          (c: Collection) => c.id === selectedCollection.id
        )
      );
    }

    if (sharedCollection) {
      setSharedCollection(
        updatedCollections.find(
          (c: Collection) => c.id === sharedCollection.id
        )
      );
    }

  } catch (error) {
    console.error('Error updating image:', error);
  }
}







async function deleteImage(imageId: string) {
  if (!selectedCollection) return;

  try {
    const response = await fetch(
      `${API_URL}/collections/${selectedCollection.id}/images/${imageId}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }

    const updatedCollections = await fetch(
      `${API_URL}/collections`
    ).then(res => res.json());

    setCollections(updatedCollections);

    const updatedCollection = updatedCollections.find(
      (collection: Collection) => collection.id === selectedCollection.id
    );

    setSelectedCollection(updatedCollection);

  } catch (error) {
    console.error('Error deleting image:', error);
  }
}








async function deleteCollection(collectionId: string) {
  try {
    const response = await fetch(
      `${API_URL}/collections/${collectionId}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete collection');
    }

    setSelectedCollection(null);
    fetchCollections();

  } catch (error) {
    console.error('Error deleting collection:', error);
  }
}






async function updateCollection() {
  if (!editingCollection) return;

  try {
    const response = await fetch(
      `${API_URL}/collections/${editingCollection.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCollection.name
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update collection');
    }

    const updatedCollections = await fetch(
      `${API_URL}/collections`
    ).then(res => res.json());

    setCollections(updatedCollections);

    const updatedCollection = updatedCollections.find(
      (collection: Collection) => collection.id === editingCollection.id
    );

    setEditingCollection(null);

    if (selectedCollection?.id === editingCollection.id) {
      setSelectedCollection(updatedCollection);
    }

  } catch (error) {
    console.error('Error updating collection:', error);
  }
}








function shareCollection(collectionId: string) {
  const shareUrl = `${window.location.origin}/share/${collectionId}`;

  navigator.clipboard.writeText(shareUrl)
    .then(() => {
      alert('Collection link copied!');
    })
    .catch(() => {
      alert(`Share this link: ${shareUrl}`);
    });
}







async function updateSharedImage() {
  if (!editingImage || !sharedCollection) return;

  try {
    const response = await fetch(
      `${API_URL}/collections/${sharedCollection.id}/images/${editingImage.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: editingImage.tags,
          note: editingImage.note
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update shared image');
    }

    const updatedCollection = await fetch(
      `${API_URL}/collections/${sharedCollection.id}`
    ).then(res => res.json());

    setSharedCollection(updatedCollection);
    setEditingImage(null);

  } catch (error) {
    console.error('Error updating shared image:', error);
  }
}







async function deleteSharedImage(imageId: string) {
  if (!sharedCollection) return;

  try {
    const response = await fetch(
      `${API_URL}/collections/${sharedCollection.id}/images/${imageId}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete shared image');
    }

    const updatedCollection = await fetch(
      `${API_URL}/collections/${sharedCollection.id}`
    ).then(res => res.json());

    setSharedCollection(updatedCollection);

  } catch (error) {
    console.error('Error deleting shared image:', error);
  }
}







async function addImageToSharedCollection(image: any) {
  if (!sharedCollection) return;

  try {
    const response = await fetch(
      `${API_URL}/collections/${sharedCollection.id}/images`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: image.webformatURL,
          tags: image.tags,
          note: ''
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add image to shared collection');
    }

    const updatedCollection = await fetch(
      `${API_URL}/collections/${sharedCollection.id}`
    ).then(res => res.json());

    setSharedCollection(updatedCollection);
    setImageToSave(null);
    setShowSavedPopup(true);

  } catch (error) {
    console.error('Error adding image to shared collection:', error);
  }
}













  // prevents entire personal dashboard from showing with a shared collection link
  // ONLY shared collection is shown
  const isSharedPage = window.location.pathname.startsWith('/share/');      
  
  if (isSharedPage) {
  return (
    <div
      style={{
        padding: '2rem 0',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {sharedCollection ? (
        <div className="collection-view">

          <h1>{sharedCollection.name}</h1>

          <p>Shared collection — you can add, edit, and remove images.</p>

        {!searchOpen && (
        <button onClick={() => setSearchOpen(true)}>
          Search Images
        </button>
        )}

      {searchOpen && (
       <div style={{ marginBottom: '2rem' }}>
       <input
         type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for an image to add"
        />

      <button onClick={searchImages}>
       Search
      </button>

      <button
        onClick={() => {
          setSearchOpen(false);
          setSearchTerm('');
          setSearchResults([]);
        }}
     >
      Close Search
      </button>
      </div>
    )}




          <div className="image-grid">
          {searchResults.map((image) => (
           <div key={image.id}>
             <img
               src={image.webformatURL}
                alt={image.tags}
               style={{ width: '200px' }}
             />

             <button
              onClick={() => addImageToSharedCollection(image)}
              >
            Add to Collection
            </button>


            </div>
         ))}
        </div>


          <div className="collection-image-grid">
            {sharedCollection.images.map((image) => (
              <div
                className="collection-image-card"
                key={image.id}
              >
                <img
                  src={image.url}
                  alt={image.note}
                />

                <p className="image-tags">
                  {image.tags}
                </p>

                <p className="image-note">
                  {image.note}
                </p>

                <button
                  onClick={() => setEditingImage(image)}
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteSharedImage(image.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {editingImage && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Edit Image</h3>

              <input
                type="text"
                value={editingImage.tags}
                onChange={(e) =>
                  setEditingImage({
                    ...editingImage,
                    tags: e.target.value
                  })
                }
                placeholder="Tags"
              />

              <input
                type="text"
                value={editingImage.note}
                onChange={(e) =>
                  setEditingImage({
                    ...editingImage,
                    note: e.target.value
                  })
                }
                placeholder="Note"
              />

              <button onClick={updateSharedImage}>
                Save Changes
              </button>

              <button
                onClick={() => setEditingImage(null)}
              >
                Cancel
              </button>
            </div>
          )}

        </div>
       ) : (
        <p>Loading shared collection...</p>
      )}

      {showSavedPopup && (
        <div className="save-modal-overlay">
          <div className="save-modal">
            <button
              className="close-modal"
              onClick={() => setShowSavedPopup(false)}
            >
              ×
            </button>

            <h2>Image Saved!</h2>

            <button
              onClick={() => setShowSavedPopup(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}


      {editingImage && (
  <div className="save-modal-overlay">
    <div className="save-modal">
      <button
        className="close-modal"
        onClick={() => setEditingImage(null)}
      >
        ×
      </button>

      <h2>Edit Image</h2>

      <input
        type="text"
        value={editingImage.tags}
        onChange={(e) =>
          setEditingImage({
            ...editingImage,
            tags: e.target.value
          })
        }
        placeholder="Tags"
      />

      <input
        type="text"
        value={editingImage.note}
        onChange={(e) =>
          setEditingImage({
            ...editingImage,
            note: e.target.value
          })
        }
        placeholder="Note"
      />

      <button onClick={updateImage}>
        Save Changes
      </button>
    </div>
  </div>
)}

    </div>
  );
}


  




  // everything here down is JSX; actual UI react should display
  // REGULAR non shared page
  return (
    // container around the actual page
    <div style={{ padding: '2rem 0', width: '100%', boxSizing: 'border-box' }}>
      {!isSharedPage && (
          <h1>My Image Boards</h1>
)}



  {/* another container w/spacing around input and button */}
   
      {!selectedCollection && !searchOpen && (
  <button onClick={() => setSearchOpen(true)}>
    Search Images
  </button>
)}

{!selectedCollection && searchOpen && (
  <div style={{ marginBottom: '2rem' }}>
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search for images"
    />

    <button onClick={searchImages}>
      Search
    </button>

    <button
      onClick={() => {
        setSearchOpen(false);
        setSearchTerm('');
        setSearchResults([]);
      }}
    >
      Close Search
    </button>
  </div>
)}





{!selectedCollection && searchOpen && (
  <div className="image-grid">
  {searchResults.map((image) => (
    <div key={image.id}>
      <img
        src={image.webformatURL}
        alt={image.tags}
        style={{ width: '200px' }}
      />

      <button
        onClick={() => {
          setImageToSave(image);
          setSaveMessage('');
        }}
      >
        Save
      </button>


    </div>
  ))}
</div>
)}





    <div style={{ marginBottom: '2rem' }}>

       {/* value: text displayed in input should equal newCollectionName */}
       {/* onChange: e = event generated by input, when user changes text, update newCollectionName. keeps react state 
       synchronized w/ what user is typing */}
       {/* placeholder: disappears when user types something - only shown when input is empty */}
        <input
          type="text"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          placeholder="New collection name"
        />

      {/* when button clicked, run createCollection() method */}
        <button onClick={createCollection}>Create Collection</button>
      </div>






      

      {imageToSave && (
    <div className="save-modal-overlay">
    <div className="save-modal">
      <button
        className="close-modal"
        onClick={() => setImageToSave(null)}
      >
        ×
      </button>

      <h2>Choose a Collection</h2>

      <div className="save-collection-list">
        {collections.map((collection) => (
          <button
            key={collection.id}
            onClick={() => saveImageToCollection(collection.id)}
          >
            {collection.name}
          </button>
        ))}
      </div>
    </div>
  </div>
)}




{showSavedPopup && (
  <div className="save-modal-overlay">
    <div className="save-modal">
      <button
        className="close-modal"
        onClick={() => setShowSavedPopup(false)}
      >
        ×
      </button>

      <h2>Image Saved!</h2>

      <button
        onClick={() => setShowSavedPopup(false)}
      >
        Done
      </button>
    </div>
  </div>
)}








      {/* {} in JSX means run this javascript here  */}
      {/* if there are 0 collections in the list, display the <p> message */}
      {/* .map() = JS array method, goes through every item in collections array (c = current collection being parsed) */}
      {/* for each collection processed, react pulls actual JSX onto the page  */}
      {/* key gives each collection a unique identifier, allows react to keep track of which ui elements correspond 
      to which collection when the data changes*/}
    {!selectedCollection && (
    <div className="collection-grid">
      {collections.length === 0 && (
    <p className="no-collections">No collections yet — create one above!</p>
  )}  

  {collections.map((c) => (
    <div
      className="collection-card"
      key={c.id}
      onClick={() => setSelectedCollection(c)}
    >
      {/* Preview image */}
      {c.images.length > 0 ? (
        <img
          className="collection-preview"
          src={c.images[0].url}
          alt={c.name}
        />
      ) : (
        <div className="collection-preview empty-preview">
          No Images Yet
        </div>
      )}

      {/* Collection information */}
      <div className="collection-info">
        <h2>{c.name}</h2>
        <p>{c.images.length} image(s)</p>
      </div>

      {/* Collection actions */}
      <div className="collection-buttons">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingCollection(c);
          }}
        >
          Edit
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            shareCollection(c.id);
          }}
        >
          Share
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteCollection(c.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  ))}
</div>
)}





      {editingCollection && (
      <div style={{ marginBottom: '2rem' }}>
       <h3>Edit Collection Name</h3>

        <input
          type="text"
          value={editingCollection.name}
          onChange={(e) =>
            setEditingCollection({
              ...editingCollection,
              name: e.target.value
            })
          }
          placeholder="Collection name"
       />

          <button onClick={updateCollection}>Save Collection Name</button>
        </div>
     )}





      {/* NEW BLOCK TO HOLD SELECTIONS */}
      {/* button: after enterting selected collection, click button to return to search page  */}
      {selectedCollection && (
        <div className="collection-view">

          <button onClick={() => setSelectedCollection(null)}>
          ← Back to Search
          </button>

          <h2>{selectedCollection.name}</h2>

        <div className="collection-image-grid">
      {selectedCollection.images.map((image) => (
        <div className="collection-image-card" key={image.id}>
          <img src={image.url} alt={image.note} />

          <p className="image-tags">{image.tags}</p>
          <p className="image-note">{image.note}</p>

          <button onClick={() => setEditingImage(image)}>
           Edit
          </button>

          <button onClick={() => deleteImage(image.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>



      {editingImage && (
  <div className="save-modal-overlay">
    <div className="save-modal">
      <button
        className="close-modal"
        onClick={() => setEditingImage(null)}
      >
        ×
      </button>

      <h2>Edit Image</h2>

      <input
        type="text"
        value={editingImage.tags}
        onChange={(e) =>
          setEditingImage({
            ...editingImage,
            tags: e.target.value
          })
        }
        placeholder="Tags"
      />

      <input
        type="text"
        value={editingImage.note}
        onChange={(e) =>
          setEditingImage({
            ...editingImage,
            note: e.target.value
          })
        }
        placeholder="Note"
      />

      <button onClick={updateImage}>
        Save Changes
      </button>
    </div>
  </div>
)}




        </div>
      )}
    


      {sharedCollection && (
  <div style={{ marginTop: '2rem' }}>
    <h2>Shared Collection: {sharedCollection.name}</h2>

    {sharedCollection.images.map((image) => (
      <div key={image.id}>
        <img
          src={image.url}
          alt={image.note}
          style={{ width: '200px' }}
        />

        <p>{image.tags}</p>
        <p>{image.note}</p>
      </div>
    ))}
  </div>
)}



    </div>
  );
}

// makes the App component available for other files to IMPORT
// App is the default EXPORT from THIS file
export default App;
