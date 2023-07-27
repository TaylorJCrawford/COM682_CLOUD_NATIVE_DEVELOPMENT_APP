import React from 'react'
import Card from './Card';

const Cards = ({obj}) => {

  return (
    <div className='custom_card'>
      {obj.map((data) => {
        let part1 = process.env.REACT_APP_TOKEN_PART1 + "thumbnails/";
        let part2 = process.env.REACT_APP_TOKEN_PART2;
        let complete = part1 + data['thumbnail'] + part2

        return (
          <div className='custom_card'>
            <Card id={data['id']} img={complete} title={data['title']} age_rating={data['age_rating']} user_id={data['user_id']} />
          </div>
        )
      })}
    </div>
  )
}

export default Cards