'use strict'

const mfs = require('ipfs-mfs/core')
const isIpfs = require('is-ipfs')

module.exports = ({ ipld, blockService, repo, preload, options: constructorOptions }) => {
  const methods = mfs({
    ipld,
    blocks: blockService,
    datastore: repo.root,
    repoOwner: constructorOptions.repoOwner
  })

  const withPreload = fn => (...args) => {
    const paths = args.filter(arg => isIpfs.ipfsPath(arg) || isIpfs.cid(arg))

    if (paths.length) {
      const options = args[args.length - 1]
      if (options && options.preload !== false) {
        paths.forEach(path => preload(path))
      }
    }

    return fn(...args)
  }

  return {
    ...methods,

    /**
     * Copy files
     *
     * @param {String | Array<String>} from - The path(s) of the source to copy.
     * @param {String} to - The path of the destination to copy to.
     * @param {Object} [opts] - Options for copy.
     * @param {boolean} [opts.parents=false] - Whether or not to make the parent directories if they don't exist. (default: false)
     * @param {String} [opts.format=dag-pb] - Format of nodes to write any newly created directories as. (default: dag-pb)
     * @param {String} [opts.hashAlg=sha2-256] - Algorithm to use when creating CIDs for newly created directories. (default: sha2-256) {@link https://github.com/multiformats/js-multihash/blob/master/src/constants.js#L5-L343 The list of all possible values}
     * @param {boolean} [opts.flush=true] - Whether or not to immediately flush MFS changes to disk (default: true).
     * @returns {Promise<string>}
     */
    cp: withPreload(methods.cp),

    /**
     * Make a directory
     *
     * @param {String} path - The path to the directory to make.
     * @param {Object} [opts] - Options for mkdir.
     * @param {boolean} [opts.parents=false] - Value to decide whether or not to make the parent directories if they don't exist. (default: false)
     * @param {String} [opts.format=dag-pb] - Format of nodes to write any newly created directories as. (default: dag-pb).
     * @param {String} [opts.hashAlg] - Algorithm to use when creating CIDs for newly created directories. (default: sha2-256) {@link https://github.com/multiformats/js-multihash/blob/master/src/constants.js#L5-L343 The list of all possible values}
     * @param {boolean} [opts.flush=true] - Whether or not to immediately flush MFS changes to disk (default: true).
     * @returns {Promise<void>}
     */
    mkdir: methods.mkdir,

    /**
     * @typedef {Object} StatOutput
     * @prop {String} hash - Output hash.
     * @prop {number} size - File size in bytes.
     * @prop {number} cumulativeSize - Integer with the size of the DAGNodes making up the file in Bytes.
     * @prop {string} type - Output type either 'directory' or 'file'.
     * @prop {number} blocks - If type is directory, this is the number of files in the directory. If it is file it is the number of blocks that make up the file.
     * @prop {boolean} withLocality - Indicate if locality information is present.
     * @prop {boolean} local - Indicate if the queried dag is fully present locally.
     * @prop {number} sizeLocal - Integer indicating the cumulative size of the data present locally.
     */

    /**
     * Get file or directory status.
     *
     * @param {String} path - Path to the file or directory to stat.
     * @param {Object} [opts] - Options for stat.
     * @param {boolean} [opts.hash=false] - Return only the hash. (default: false)
     * @param {boolean} [opts.size=false] - Return only the size. (default: false)
     * @param {boolean} [opts.withLocal=false] - Compute the amount of the dag that is local, and if possible the total size. (default: false)
     * @returns {Promise<StatOutput>}
     */
    stat: withPreload(methods.stat),

    /**
     * Remove a file or directory.
     *
     * @param {String | Array<String>} paths - One or more paths to remove.
     * @param {Object} [opts] - Options for remove.
     * @param {boolean} [opts.recursive=false] - Whether or not to remove directories recursively. (default: false)
     * @returns {Promise<void>}
     */
    rm: methods.rm,

    /**
     * @typedef {Object} ReadOptions
     * @prop {number} [opts.offset=0] - Integer with the byte offset to begin reading from (default: 0).
     * @prop {number} [opts.length] - Integer with the maximum number of bytes to read (default: Read to the end of stream).
     */

    /**
     * Read a file into a Buffer.
     *
     * @param {string} path - Path of the file to read and must point to a file (and not a directory).
     * @param {ReadOptions} [opts] - Object for read.
     * @returns {AsyncIterable<Buffer>}
     */
    read: withPreload(methods.read),

    /**
     * Write to a file.
     *
     * @param {string} path - Path of the file to write.
     * @param {Buffer | PullStream | ReadableStream | Blob | string} content - Content to write.
     * @param {Object} opts - Options for write.
     * @param {number} [opts.offset=0] - Integer with the byte offset to begin writing at. (default: 0)
     * @param {boolean} [opts.create=false] - Indicate to create the file if it doesn't exist. (default: false)
     * @param {boolean} [opts.truncate=false] - Indicate if the file should be truncated after writing all the bytes from content. (default: false)
     * @param {boolena} [opts.parents=false] - Value to decide whether or not to make the parent directories if they don't exist. (default: false)
     * @param {number} [opts.length] - Maximum number of bytes to read. (default: Read all bytes from content)
     * @param {boolean} [opts.rawLeaves=false] - If true, DAG leaves will contain raw file data and not be wrapped in a protobuf. (default: false)
     * @param {number} [opts.cidVersion=0] - The CID version to use when storing the data (storage keys are based on the CID, including its version). (default: 0)
     * @returns {Promise<void>}
     */
    write: methods.write,

    /**
     * Move files.
     *
     * @param {string | Array<string>} from - Path(s) of the source to move.
     * @param {string} to - Path of the destination to move to.
     * @param {Object} opts - Options for mv.
     * @param {boolean} [opts.parents=false] - Value to decide whether or not to make the parent directories if they don't exist. (default: false)
     * @param {String} [opts.format=dag-pb] - Format of nodes to write any newly created directories as. (default: dag-pb).
     * @param {String} [opts.hashAlg] - Algorithm to use when creating CIDs for newly created directories. (default: sha2-256) {@link https://github.com/multiformats/js-multihash/blob/master/src/constants.js#L5-L343 The list of all possible values}
     * @param {boolean} [opts.flush=true] - Value to decide whether or not to immediately flush MFS changes to disk. (default: true)
     * @returns {Promise<void>}
     * @description
     * If from has multiple values then to must be a directory.
     *
     * If from has a single value and to exists and is a directory, from will be moved into to.
     *
     * If from has a single value and to exists and is a file, from must be a file and the contents of to will be replaced with the contents of from otherwise an error will be returned.
     *
     * If from is an IPFS path, and an MFS path exists with the same name, the IPFS path will be chosen.
     *
     * All values of from will be removed after the operation is complete unless they are an IPFS path.
     */
    mv: withPreload(methods.mv),

    /**
     * Flush a given path's data to the disk.
     *
     * @param {string | Array<string>} [paths] - String paths to flush. (default: /)
     * @returns {Promise<void>}
     */
    flush: methods.flush,

    /**
     * @typedef {Object} ListOutputFile
     * @prop {string} name - Which is the file's name.
     * @prop {string} type - Which is the object's type (directory or file).
     * @prop {number} size - The size of the file in bytes.
     * @prop {string} hash - The hash of the file.
     */

    /**
     * @typedef {Object} ListOptions
     * @prop {boolean} [long=false] - Value to decide whether or not to populate type, size and hash. (default: false)
     * @prop {boolean} [sort=false] - If true entries will be sorted by filename. (default: false)
     */

    /**
     * List directories in the local mutable namespace.
     *
     * @param {string} [path="/"] - String to show listing for. (default: /)
     * @param {ListOptions} [opts] - Options for list.
     * @returns {AsyncIterable<ListOutputFile>}
     */
    ls: withPreload(methods.ls)
  }
}
