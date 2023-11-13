package org.finos.vuu.core.module.auths

object PermissionSet {

  final val NoPermissionsString = "0000000000000000000000000000000"
  final val SalesTradingPermissionString = "0000000000000000000000000000001"
  final val AlgoCoveragePermissionString = "0000000000000000000000000000010"
  final val HighTouchPermissionString = "0000000000000000000000000000100"

  final val NoPermissions = Integer.parseUnsignedInt(NoPermissionsString, 2)
  final val SalesTradingPermission = Integer.parseUnsignedInt(SalesTradingPermissionString, 2)
  final val AlgoCoveragePermission = Integer.parseUnsignedInt(AlgoCoveragePermissionString, 2)
  final val HighTouchPermission = Integer.parseUnsignedInt(HighTouchPermissionString, 2)
  final val OpsPermission = addRoles(NoPermissions, SalesTradingPermission, AlgoCoveragePermission, HighTouchPermission)




  private def padWithZeros(binaryString: String) = String.format("%" + 32 + "s", binaryString).replace(' ', '0')

  def rolesToString(userPermissions: Int): String = {
    var roles = List[String]()

    if(hasRole(userPermissions, SalesTradingPermission)){ roles = roles ++ List("SALES")}
    if(hasRole(userPermissions, AlgoCoveragePermission)){ roles = roles ++ List("ALGO")}
    if(hasRole(userPermissions, HighTouchPermission)){ roles = roles ++ List("HT")}
    if(roles.isEmpty) roles = roles ++ List("NONE")

    roles.mkString(",")
  }

  def toBinaryString(intRepresentation: Int): String = {
    val binaryString = Integer.toBinaryString(intRepresentation)
    padWithZeros(binaryString)
  }

  def hasRole(userPermissions: Int, mask: Int): Boolean = {
    (userPermissions & mask) == mask
  }

  def addRole(userPermissions: Int, mask: Int): Int = {
    userPermissions | mask
  }

  def addRoles(userPermissions: Int, masks: Int*): Int = {
    var permission = userPermissions
    masks.foreach( m => {
      permission = addRole(permission, m)
    })
    permission
  }

  def removeRole(userPermissions: Int, mask: Int): Int = {
    userPermissions ^ mask
  }



}
