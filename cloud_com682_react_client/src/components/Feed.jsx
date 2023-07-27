import { React, useState, useEffect } from 'react';
import Cards from './Cards';
import { useAuth0 } from '@auth0/auth0-react'

const Feed = () => {

  const [videos_data, setVideos] = useState([]);
  const { user, isAuthenticated } = useAuth0();

  useEffect(() => {
    fetch(process.env.REACT_APP_FLASK_API + 'clips')
      .then(res => {
        return res.json()
      })
      .then((data) => {
        setVideos(data)
      })
  }, []);

  return (
    <div className='container_main'>
      { (isAuthenticated == true) ?
        <>
          <h3 className='section_title'>
            New <span style={{ color: "#FC1503" }}>Videos</span>
          </h3>
          <Cards obj={videos_data} />
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

export default Feed