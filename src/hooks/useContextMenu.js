import { useEffect, useRef } from 'react'
const { remote } = window.require('electron')
const { Menu, MenuItem } = remote

const useContextMenu = (itemArr, targetSelector, deps) => {
    let clickedElement = useRef(null)
    useEffect(() => {
        const menu = new Menu()
        itemArr.forEach(item => {
            menu.append(new MenuItem(item))
        })
        const handleContextmenu = (e) => {
            // 当 e.target 被 targetSelector 包裹的时候 才执行下面的操作
            if (document.querySelector(targetSelector).contains(e.target)) {
                clickedElement.current = e.target
                menu.popup({ window: remote.getCurrentWindow() })
            }
        }
        window.addEventListener('contextmenu', handleContextmenu)
        return () => {
            window.removeEventListener('contextmenu', handleContextmenu)
        }
    }, deps)
    return clickedElement
}

export default useContextMenu