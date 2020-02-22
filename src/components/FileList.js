import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import { getParentNode } from '../utils/helper'

const FileList = ({ files, onFileClick, onFileDelete, onSaveEdit }) => {
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState('')

    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    const closeSearch = (editItem) => {
        setEditStatus(false)
        setValue('')
        // if we are editing a newly created file, we should delete this file by pressing esc
        if (editItem.isNew) {
            onFileDelete(editItem.id)
        }
    }
    const clickedElement = useContextMenu([
        {
            label: '打开',
            click: () => {
                const parentElement = getParentNode(clickedElement.current, 'file-item')
                if (parentElement) {
                    onFileClick(parentElement.dataset.id)
                }
            }
        },
        {
            label: '重命名',
            click: () => {
                const parentElement = getParentNode(clickedElement.current, 'file-item')
                if (parentElement) {
                    setEditStatus(parentElement.dataset.id)
                    setValue(parentElement.dataset.title)
                }
            }
        },
        {
            label: '删除',
            click: () => {
                const parentElement = getParentNode(clickedElement.current, 'file-item')
                if (parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }
            }
        }
    ], '.file-list', [files])
    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])
    useEffect(() => {
        // 自定义 hook
        const editItem = files.find(file => file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== '') {
            onSaveEdit(editItem.id, value, editItem.isNew)
            setEditStatus(false)
            setValue('')
        }

        if (escPressed && editStatus) {
            closeSearch(editItem)
        }

        // 原始 hook
        // const handleInputEvent = (event) => {
        //     const { keyCode } = event
        //     if (keyCode === 13 && editStatus) {
        //         const editItem = files.find(file => file.id === editStatus)
        //         onSaveEdit(editItem.id, value)
        //         setEditStatus(false)
        //         setValue('')
        //     } else if (keyCode === 27 && editStatus) {
        //         closeSearch(event)
        //     }
        // }
        // document.addEventListener('keyup', handleInputEvent)
        // return () => {
        //     document.removeEventListener('keyup', handleInputEvent)
        // }
    })

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li
                        className="list-group-item bg-light row d-flex align-items-center file-item mx-0"
                        key={file.id}
                        data-id={file.id}
                        data-title={file.title}
                    >
                        {(file.id !== editStatus && !file.isNew) &&
                            <>
                                <span className="col-2">
                                    <FontAwesomeIcon icon={faMarkdown} size={"lg"} />
                                </span>
                                <span className="col-6 c-link" onClick={() => { onFileClick(file.id) }}>
                                    {file.title}
                                </span>
                                {/* <button type="button" className="icon-button col-2" onClick={() => { setEditStatus(file.id); setValue(file.title) }}>
                                    <FontAwesomeIcon title={"编辑"} icon={faEdit} size={"lg"} />
                                </button>
                                <button type="button" className="icon-button col-2" onClick={() => { onFileDelete(file.id) }}>
                                    <FontAwesomeIcon title={"删除"} icon={faTrash} size={"lg"} />
                                </button> */}
                            </>
                        }
                        {((file.id === editStatus) || file.isNew) &&
                            <>
                                <input
                                    className="form-control col-10"
                                    value={value}
                                    placeholder="请输入文件名称"
                                    onChange={(e) => { setValue(e.target.value) }}

                                />
                                <button
                                    type="button"
                                    className="icon-button col-2"
                                    onClick={() => { closeSearch(file) }}
                                >
                                    <FontAwesomeIcon title={"关闭"} icon={faTimes} size={"lg"} />
                                </button>
                            </>
                        }
                    </li>
                ))
            }
        </ul>
    )
}

FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func
}

export default FileList