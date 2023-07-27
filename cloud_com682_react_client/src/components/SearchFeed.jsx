import { React, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react'
import Cards from './Cards';

const SearchFeed = () => {
  const {term} = useParams()
  const [videos, setVideos] = useState([]);
  const { user, isAuthenticated } = useAuth0();

  useEffect(() => {
    let uri = process.env.REACT_APP_FLASK_API + 'search/' + term
    fetch(uri)
      .then(res => {
        return res.json()
      })
      .then((data) => {
        console.log(data)
        setVideos(data)
      })
  }, []);

  return (
    <div className='container_main'>
      {
        (isAuthenticated == true)
          ?
            <>
              {(videos.length != 0)
                ?
                  <>
                    <h3 className='section_title'>
                    {term} <span style={{ color: "#FC1503" }}>Videos</span> 
                    </h3>
                    <Cards obj={videos} />
                  </>
                :
                  <>
                    <br />
                    <h3 className='center_content' style={{color: 'White'}}> No Videos To Dispaly - Try a new search query.</h3>
                    <br />
                  </>
            }
            </>
          :
            <>
              <br />
              <h3 className='center_content' style={{color: 'White'}}> To View Content Please Sign In or Register</h3>
              <br />
            </>
      }
    </div>
  )
}

export default SearchFeed