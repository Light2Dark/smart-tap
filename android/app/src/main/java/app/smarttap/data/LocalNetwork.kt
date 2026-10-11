package app.smarttap.data

private const val IPV4_PARTS = 4
private val OCTET = 0..255

/** Second octets that make an address private, by first octet: 10/8, 172.16/12, 192.168/16. */
private val PRIVATE_BLOCKS = mapOf(10 to OCTET, 172 to 16..31, 192 to 168..168)

/** True for a private IPv4 address, like a dev server on the LAN. */
fun isLocalNetworkHost(host: String): Boolean {
    val octets = host.split(".").map { it.toIntOrNull() ?: -1 }
    if (octets.size != IPV4_PARTS || octets.any { it !in OCTET }) {
        return false
    }
    return PRIVATE_BLOCKS[octets[0]]?.contains(octets[1]) == true
}
