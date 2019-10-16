import * as React from 'react'
import * as ReactDOM from 'react-dom'

const body = document.getElementsByTagName('body')[0]
const root = document.createElement('root')
if (body) {
    body.appendChild(root)
}

const App = () => {
    return (
        <div>
            Hello, world!
        </div>
    )
}

ReactDOM.render(<App />, root)
