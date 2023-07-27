import { React, useState, useEffect } from 'react'
import { Link, useNavigate } from "react-router-dom"
import { useAuth0 } from '@auth0/auth0-react'
import LoginButton from './Login/LoginButton';
import LogoutButton from './Login/LogoutButton';

const Navbar = () => {

  const navigate = useNavigate();
  const [activeSearch, setActiveSearch] = useState()
  const { user, isAuthenticated } = useAuth0();
  const [ user_role, setUserRole ] = useState();

  function SendSubmit() {
    let search_term = document.getElementById("search").value
    if (search_term != ''){
      setActiveSearch('true')
      let route = '/search/' + search_term
      navigate(route)
    }
  }
  let user_id;
  try
  {user_id = user['sub']}
  catch
  {user_id = 'null'}


  useEffect(() => {
    fetch(process.env.REACT_APP_FLASK_API + 'account/'+ user_id)
      .then(res => {
        return res.json()
      })
      .then((data) => {
        console.log(data['role'])
        console.log(data)
        setUserRole(data['role'])

        // setUserRole(data[0]['feedback'])
      })
  }, [user] );

  return (
    <nav className="navbar navbar-dark " >
      <a className="navbar-brand" href="/"><h1 style={{ color: "#960e03"}}>Stream Delight</h1></a>
        <div className="">
              <div className="action_container">
                {activeSearch == 'true' ?
                  <Link to="/">
                    <button className="btn btn-outline-success" type='' onClick={() => setActiveSearch('false')} style={{color: "white"}}>Back To Home</button>
                  </Link>
                    :
                    <>
                      <div class="input-group">
                        <input className="form-control rounded" type="search" name="search" id="search" placeholder="Search" aria-label="Search" />
                        <button class="btn btn-outline-info my-2 my-sm-0" type="submit" onClick={() => SendSubmit()}>Search Title</button>
                      </div>
                    </>
                }

                { isAuthenticated == true  ?
                  <>
                    { user_role == 'creator' ?
                    <Link to="/add">
                        <button className="btn btn-outline-success" id='Add_Button' type='' style={{color: "white"}}>Add New Video</button>
                    </Link>
                    :
                    <></>
                    }
                    <LogoutButton />
                  </>
                :
                  <LoginButton />
                }
              </div>
        </div>
    </nav>
  )
}

export default Navbar