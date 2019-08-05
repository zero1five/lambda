<% if (isTypeScript) { %>
import React from 'react';
<% } %>
import styles from './index.<%= cssExt %>';

export default function() {
  return (
    <div className={styles.normal}>
      <h1>Page <%= name %></h1>
    </div>
  );
}
