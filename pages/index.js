import React from 'react';
import Link from 'next/link';
import Meta from '../lib/meta';

export default () => (
    <div>
      <Meta/>
      <link
          href='http://fonts.googleapis.com/css?family=Cabin'
          rel='stylesheet'
          type='text/css'
      ></link>
      <h1>Choose page to work on</h1>
      <ul>
        <li>
          <Link href="/Organizer"><a>Organizers page</a></Link>
        </li>
        <li>
          <Link href="/Typer"><a>Typers page</a></Link>
        </li>
      </ul>
    </div>
)